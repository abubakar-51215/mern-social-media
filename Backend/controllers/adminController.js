import User from '../models/User.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

// Get admin dashboard statistics
export const getAdminStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();
    
    // Total posts
    const totalPosts = await Post.countDocuments();
    
    // Total comments (from posts)
    const postsWithComments = await Post.aggregate([
      { $project: { commentCount: { $size: "$comments" } } },
      { $group: { _id: null, total: { $sum: "$commentCount" } } }
    ]);
    const totalComments = postsWithComments.length > 0 ? postsWithComments[0].total : 0;
    
    // Total likes (from posts)
    const postsWithLikes = await Post.aggregate([
      { $project: { likeCount: { $size: "$likes" } } },
      { $group: { _id: null, total: { $sum: "$likeCount" } } }
    ]);
    const totalLikes = postsWithLikes.length > 0 ? postsWithLikes[0].total : 0;
    
    // New users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today }
    });
    
    // Reports in last 24 hours (placeholder - implement when you have reports model)
    const reportsLast24Hours = 0;
    
    // Active vs Inactive users (active = logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });
    const inactiveUsers = totalUsers - activeUsers;
    
    // Signups per week (last 7 days)
    const signupsPerWeek = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      signupsPerWeek.push(count);
    }
    
    // Posts per day (last 7 days)
    const postsPerDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await Post.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      postsPerDay.push(count);
    }
    
    res.json({
      totalUsers,
      totalPosts,
      totalComments,
      totalLikes,
      newUsersToday,
      reportsLast24Hours,
      activeUsers,
      inactiveUsers,
      signupsPerWeek,
      postsPerDay
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ message: 'Error fetching admin statistics', error: error.message });
  }
};

// Get all users with pagination and search
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    // Get users with post counts
    const users = await User.find(searchQuery)
      .select('-password -twoFactorSecret -backupCodes')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get post counts for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const postCount = await Post.countDocuments({ user: user._id });
      return {
        ...user,
        postCount,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        friendsCount: user.friends?.length || 0
      };
    }));

    const total = await User.countDocuments(searchQuery);

    res.json({
      users: usersWithStats,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get user details and activity
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -twoFactorSecret -backupCodes')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts
    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name profilePicture')
      .lean();

    // Get post count
    const postCount = await Post.countDocuments({ user: userId });

    // Get total likes received
    const postsWithLikes = await Post.aggregate([
      { $match: { user: user._id } },
      { $project: { likeCount: { $size: "$likes" } } },
      { $group: { _id: null, total: { $sum: "$likeCount" } } }
    ]);
    const totalLikes = postsWithLikes.length > 0 ? postsWithLikes[0].total : 0;

    // Get total comments made
    const totalComments = await Post.countDocuments({
      'comments.user': userId
    });

    res.json({
      user: {
        ...user,
        postCount,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        friendsCount: user.friends?.length || 0
      },
      activity: {
        totalLikes,
        totalComments,
        recentPosts: posts
      }
    });
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
};

// Delete user account
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's posts
    await Post.deleteMany({ user: userId });

    // Remove user from friends lists
    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );

    // Remove user from followers/following lists
    await User.updateMany(
      { $or: [{ followers: userId }, { following: userId }] },
      { $pull: { followers: userId, following: userId } }
    );

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Block/Unblock user
export const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { blocked } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBlocked = blocked;
    await user.save();

    res.json({ 
      message: blocked ? 'User blocked successfully' : 'User unblocked successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Error toggling user block:', error);
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
};

// Shadow ban user
export const toggleShadowBan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { shadowBanned } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isShadowBanned = shadowBanned;
    await user.save();

    res.json({ 
      message: shadowBanned ? 'User shadow banned' : 'Shadow ban removed',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isShadowBanned: user.isShadowBanned
      }
    });
  } catch (error) {
    console.error('Error toggling shadow ban:', error);
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
};

// Warn user
export const warnUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create warning notification
    const notification = await Notification.create({
      recipient: userId,
      type: 'warning',
      message: message || 'You have received a warning from the administrator.',
      sender: req.user.id
    });

    res.json({ 
      message: 'Warning sent successfully',
      notification
    });
  } catch (error) {
    console.error('Error warning user:', error);
    res.status(500).json({ message: 'Error sending warning', error: error.message });
  }
};

// ============= POST MANAGEMENT =============

// Get all posts with filters
export const getAllPosts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      userId, 
      hashtag, 
      startDate, 
      endDate, 
      reported 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const query = {};

    // Filter by user (only if valid ObjectId)
    if (userId) {
      // Support both raw ObjectId and populated userId strings; ignore invalid values
      const { Types } = await import('mongoose');
      if (Types.ObjectId.isValid(userId)) {
        query.user = userId;
      }
    }

    // Filter by hashtag
    if (hashtag) {
      query.hashtags = { $in: [hashtag] };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Filter by reported posts
    if (reported === 'true') {
      query.reportCount = { $gt: 0 };
    }

    const posts = await Post.find(query)
      .populate('user', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
};

// Get post analytics
export const getPostAnalytics = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('user', 'name email profilePicture')
      .populate('comments.user', 'name profilePicture')
      .populate('likes', 'name profilePicture');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const analytics = {
      postId: post._id,
      user: post.user,
      content: post.content,
      mediaType: post.mediaType,
      images: post.images,
      videos: post.videos,
      createdAt: post.createdAt,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      sharesCount: post.shares.length,
      savesCount: post.saves.length,
      reportCount: post.reportCount,
      isInappropriate: post.isInappropriate,
      commentsDisabled: post.commentsDisabled,
      hashtags: post.hashtags,
      location: post.location,
      topLikers: post.likes.slice(0, 10),
      recentComments: post.comments.slice(-5).reverse()
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error getting post analytics:', error);
    res.status(500).json({ message: 'Error fetching post analytics', error: error.message });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByIdAndDelete(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Delete related notifications
    await Notification.deleteMany({ 
      $or: [
        { post: postId },
        { 'metadata.postId': postId }
      ]
    });

    res.json({ 
      message: 'Post deleted successfully',
      postId: post._id
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
};

// Mark post as inappropriate
export const markPostInappropriate = async (req, res) => {
  try {
    const { postId } = req.params;
    const { inappropriate } = req.body;

    const post = await Post.findByIdAndUpdate(
      postId,
      { isInappropriate: inappropriate !== false },
      { new: true }
    ).populate('user', 'name email profilePicture');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ 
      message: post.isInappropriate ? 'Post marked as inappropriate' : 'Post marked as appropriate',
      post: {
        _id: post._id,
        isInappropriate: post.isInappropriate,
        user: post.user
      }
    });
  } catch (error) {
    console.error('Error marking post:', error);
    res.status(500).json({ message: 'Error updating post', error: error.message });
  }
};

// Toggle comments on post
export const togglePostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.commentsDisabled = !post.commentsDisabled;
    await post.save();

    res.json({ 
      message: post.commentsDisabled ? 'Comments disabled' : 'Comments enabled',
      post: {
        _id: post._id,
        commentsDisabled: post.commentsDisabled
      }
    });
  } catch (error) {
    console.error('Error toggling comments:', error);
    res.status(500).json({ message: 'Error updating post', error: error.message });
  }
};

