import User from '../models/User.js';
import Post from '../models/Post.js';
import Report from '../models/Report.js';
import mongoose from 'mongoose';

// Get new users per day (last 7 days)
export const getNewUsersPerDay = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const users = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({ data: users });
  } catch (error) {
    console.error('Error getting new users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get new posts per day (last 7 days)
export const getNewPostsPerDay = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({ data: posts });
  } catch (error) {
    console.error('Error getting new posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get retention rate (users active in last 7 days)
export const getRetentionRate = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await User.countDocuments({
      updatedAt: { $gte: sevenDaysAgo }
    });

    const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    res.json({
      totalUsers,
      activeUsers,
      retentionRate: Math.round(retentionRate * 100) / 100
    });
  } catch (error) {
    console.error('Error getting retention rate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get most active users (by posts count)
export const getMostActiveUsers = async (req, res) => {
  try {
    const limit = req.query.limit || 10;

    const activeUsers = await User.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'user',
          as: 'userPosts'
        }
      },
      {
        $addFields: {
          postCount: { $size: '$userPosts' }
        }
      },
      {
        $match: {
          postCount: { $gt: 0 }
        }
      },
      {
        $sort: { postCount: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          postCount: 1,
          profilePicture: 1
        }
      }
    ]);

    res.json({ data: activeUsers });
  } catch (error) {
    console.error('Error getting most active users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get most liked posts
export const getMostLikedPosts = async (req, res) => {
  try {
    const limit = req.query.limit || 10;

    const likedPosts = await Post.aggregate([
      {
        $addFields: {
          likeCount: { $size: { $ifNull: ['$likes', []] } }
        }
      },
      {
        $match: {
          likeCount: { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $unwind: '$author'
      },
      {
        $sort: { likeCount: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 1,
          content: 1,
          likeCount: 1,
          createdAt: 1,
          'author.name': 1,
          'author._id': 1
        }
      }
    ]);

    res.json({ data: likedPosts });
  } catch (error) {
    console.error('Error getting most liked posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get most reported posts
export const getMostReportedPosts = async (req, res) => {
  try {
    const limit = req.query.limit || 10;

    const reportedPosts = await Report.aggregate([
      {
        $match: {
          reportType: 'post'
        }
      },
      {
        $group: {
          _id: '$reportedItemId',
          reportCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: '_id',
          as: 'post'
        }
      },
      {
        $unwind: '$post'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'post.user',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $unwind: '$author'
      },
      {
        $sort: { reportCount: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 1,
          reportCount: 1,
          'post.content': 1,
          'post.createdAt': 1,
          'author.name': 1,
          'author._id': 1
        }
      }
    ]);

    res.json({ data: reportedPosts });
  } catch (error) {
    console.error('Error getting most reported posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get platform overview stats
export const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalReports = await Report.countDocuments();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const newPostsThisWeek = await Post.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const activeUsersThisWeek = await User.countDocuments({
      updatedAt: { $gte: sevenDaysAgo }
    });

    const retentionRate = totalUsers > 0 ? (activeUsersThisWeek / totalUsers) * 100 : 0;

    res.json({
      totalUsers,
      totalPosts,
      totalReports,
      newUsersThisWeek,
      newPostsThisWeek,
      activeUsersThisWeek,
      retentionRate: Math.round(retentionRate * 100) / 100
    });
  } catch (error) {
    console.error('Error getting platform stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
