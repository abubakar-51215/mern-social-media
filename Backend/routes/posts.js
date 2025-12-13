import express from "express";
import Post from "../models/Post.js";
import { protect } from "../middleware/auth.js";
import { upload, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// Get all posts (feed)
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const User = (await import('../models/User.js')).default;
    
    // Get current user's friends
    const currentUser = await User.findById(userId).select('friends');
    const friendIds = currentUser.friends.map(id => id.toString());
    
    // Get all posts
    const allPosts = await Post.find()
      .populate('user', 'name username email profilePicture isPrivate friends')
      .populate('likes', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Filter posts based on privacy settings
    const visiblePosts = allPosts.filter(post => {
      // Always show user's own posts
      if (post.user._id.toString() === userId.toString()) {
        return true;
      }
      
      // If account is not private, show the post
      if (!post.user.isPrivate) {
        return true;
      }
      
      // If account is private, only show if user is a friend
      return friendIds.includes(post.user._id.toString());
    });
    
    res.json(visiblePosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get posts by user ID
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?._id || req.user;
    const targetUserId = req.params.userId;
    
    const User = (await import('../models/User.js')).default;
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if viewing own profile
    const isOwnProfile = currentUserId.toString() === targetUserId;
    
    // Check if they are friends
    const currentUser = await User.findById(currentUserId);
    const areFriends = currentUser.friends.some(
      friendId => friendId.toString() === targetUserId
    );
    
    // If account is private and not friends (and not own profile), return empty
    if (targetUser.isPrivate && !areFriends && !isOwnProfile) {
      return res.json([]);
    }
    
    const posts = await Post.find({ user: targetUserId })
      .populate('user', 'name username email profilePicture isPrivate')
      .populate('likes', 'name username profilePicture')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get liked posts (must be before /:postId routes)
router.get("/liked/all", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    
    const likedPosts = await Post.find({ likes: userId })
      .populate('user', 'name username email profilePicture')
      .populate('likes', 'name username profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(likedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get saved posts (must be before /:postId routes)
router.get("/saved/all", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    
    const savedPosts = await Post.find({ saves: userId })
      .populate('user', 'name username email profilePicture')
      .populate('likes', 'name username profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(savedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get likes for a specific post (must be before /:postId routes)
router.get("/:postId/likes", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('likes', 'name username profilePicture email');
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Filter out any null values (deleted users) and ensure we have valid user data
    const validLikes = (post.likes || []).filter(user => user && (user.name || user.email));
    
    res.json(validLikes);
  } catch (err) {
    console.error('Error fetching likes:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get posts by hashtag (must be before /:postId routes)
router.get("/hashtag/:tag", protect, async (req, res) => {
  try {
    const tag = req.params.tag.toLowerCase();
    
    const posts = await Post.find({ hashtags: tag })
      .populate('user', 'name username email profilePicture')
      .populate('likes', 'name username profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new post with image upload
router.post("/", protect, upload.array('images', 5), handleUploadError, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { content, location, music } = req.body;
    
    // Parse music data if provided
    let musicData = null;
    if (music) {
      try {
        musicData = typeof music === 'string' ? JSON.parse(music) : music;
      } catch (e) {
        console.error('Error parsing music data:', e);
      }
    }
    
    // Get uploaded file paths
    const imagePaths = req.files ? req.files.map(file => `/uploads/posts/${file.filename}`) : [];
    
    // Parse hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      hashtags.push(match[1].toLowerCase());
    }
    
    // Parse mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentionUsernames = [];
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionUsernames.push(match[1].toLowerCase());
    }
    
    // Find mentioned users
    let mentionedUserIds = [];
    if (mentionUsernames.length > 0) {
      const User = (await import('../models/User.js')).default;
      const mentionedUsers = await User.find({
        $or: [
          { username: { $in: mentionUsernames } },
          { email: { $regex: new RegExp(`^(${mentionUsernames.join('|')})@`, 'i') } }
        ]
      }).select('_id name');
      mentionedUserIds = mentionedUsers.map(u => u._id);
      
      // Create notifications for mentioned users
      const Notification = (await import('../models/Notification.js')).default;
      const poster = await User.findById(userId).select('name');
      
      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser._id.toString() !== userId.toString()) {
          await Notification.create({
            recipient: mentionedUser._id,
            sender: userId,
            type: 'mention',
            message: `${poster.name} mentioned you in a post`
          });
        }
      }
    }
    
    const post = new Post({
      user: userId,
      content,
      images: imagePaths,
      location: location || '',
      hashtags: [...new Set(hashtags)],
      mentions: mentionedUserIds,
      music: musicData
    });
    
    await post.save();
    const populatedPost = await Post.findById(post._id)
      .populate('user', 'name username email profilePicture')
      .populate('mentions', 'name username profilePicture')
      .populate('likes', 'name username profilePicture');
    
    // Emit real-time new post to friends
    const { io, userSocketMap } = await import('../index.js');
    const User = (await import('../models/User.js')).default;
    const postCreator = await User.findById(userId).populate('friends', '_id');
    
    // Broadcast to friends
    if (postCreator && postCreator.friends) {
      postCreator.friends.forEach(friend => {
        const socketId = userSocketMap.get(friend._id.toString());
        if (socketId) {
          io.to(socketId).emit('newPost', {
            post: populatedPost
          });
        }
      });
    }
    
    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like/Unlike a post
router.put("/:postId/like", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const post = await Post.findById(req.params.postId).populate('user', 'isPrivate friends');
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Check if post owner's account is private
    if (post.user.isPrivate) {
      // Check if the user trying to like is a friend or the owner themselves
      const isFriend = post.user.friends.some(friendId => friendId.toString() === userId.toString());
      const isOwner = post.user._id.toString() === userId.toString();
      
      if (!isFriend && !isOwner) {
        return res.status(403).json({ message: "This account is private. You must be friends to interact with their posts." });
      }
    }
    
    const likeIndex = post.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
      // Remove notification if unlike
      const Notification = (await import('../models/Notification.js')).default;
      await Notification.deleteOne({ 
        recipient: post.user._id, 
        sender: userId, 
        post: post._id, 
        type: 'like' 
      });
    } else {
      post.likes.push(userId);
      // Create notification for like (only if not liking own post)
      if (post.user._id.toString() !== userId.toString()) {
        const Notification = (await import('../models/Notification.js')).default;
        const User = (await import('../models/User.js')).default;
        const liker = await User.findById(userId).select('name');
        
        await Notification.create({
          recipient: post.user._id,
          sender: userId,
          type: 'like',
          post: post._id,
          message: `${liker.name} liked your post`
        });
        
        // Send real-time notification via Socket.io
        const io = global.io;
        const userSocketMap = global.userSocketMap;
        if (io && userSocketMap) {
          const recipientSocketId = userSocketMap.get(post.user._id.toString());
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('newNotification', {
              type: 'like',
              message: `${liker.name} liked your post`
            });
          }
        }
      }
    }
    
    await post.save();
    const updatedPost = await Post.findById(post._id)
      .populate('user', 'name username email profilePicture')
      .populate('likes', 'name username profilePicture');
    
    // Emit real-time post update
    const io = global.io;
    const userSocketMap = global.userSocketMap;
    if (io && userSocketMap) {
      const User = (await import('../models/User.js')).default;
      const postOwner = await User.findById(post.user._id).populate('friends', '_id');
      
      // Broadcast to post owner and their friends
      const broadcastTo = [post.user._id.toString(), ...postOwner.friends.map(f => f._id.toString())];
      broadcastTo.forEach(userId => {
        const socketId = userSocketMap.get(userId);
        if (socketId) {
          io.to(socketId).emit('postLiked', {
            postId: post._id,
            likes: updatedPost.likes,
            likesCount: updatedPost.likes.length
          });
        }
      });
    }
    
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a post
router.put("/:postId", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to update this post" });
    }
    
    const { content, images, location } = req.body;
    
    if (content !== undefined) post.content = content;
    if (images !== undefined) post.images = images;
    if (location !== undefined) post.location = location;
    
    // Mark as edited
    post.isEdited = true;
    post.editedAt = new Date();
    
    // Parse hashtags from content (only if content exists)
    if (content) {
      const hashtagRegex = /#(\w+)/g;
      const hashtags = [];
      let match;
      while ((match = hashtagRegex.exec(content)) !== null) {
        hashtags.push(match[1].toLowerCase());
      }
      post.hashtags = [...new Set(hashtags)];
      
      // Parse mentions from content
      const mentionRegex = /@(\w+)/g;
      const mentionUsernames = [];
      while ((match = mentionRegex.exec(content)) !== null) {
        mentionUsernames.push(match[1].toLowerCase());
      }
      
      // Find mentioned users
      if (mentionUsernames.length > 0) {
        const User = (await import('../models/User.js')).default;
        const mentionedUsers = await User.find({
          $or: [
            { username: { $in: mentionUsernames } },
            { email: { $regex: new RegExp(`^(${mentionUsernames.join('|')})@`, 'i') } }
          ]
        }).select('_id');
        post.mentions = mentionedUsers.map(u => u._id);
      }
    }
    
    await post.save();
    const populatedPost = await Post.findById(post._id)
      .populate('user', 'name username email profilePicture')
      .populate('mentions', 'name username profilePicture')
      .populate('likes', 'name username profilePicture');
    
    res.json(populatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment to a post
router.post("/:postId/comment", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    
    const post = await Post.findById(req.params.postId).populate('user', 'isPrivate friends');
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Check if post owner's account is private
    if (post.user.isPrivate) {
      // Check if the user trying to comment is a friend or the owner themselves
      const isFriend = post.user.friends.some(friendId => friendId.toString() === userId.toString());
      const isOwner = post.user._id.toString() === userId.toString();
      
      if (!isFriend && !isOwner) {
        return res.status(403).json({ message: "This account is private. You must be friends to comment on their posts." });
      }
    }
    
    const newComment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    };
    
    post.comments.push(newComment);
    await post.save();
    
    // Create notification for comment (only if not commenting on own post)
    if (post.user._id.toString() !== userId.toString()) {
      const Notification = (await import('../models/Notification.js')).default;
      const User = (await import('../models/User.js')).default;
      const commenter = await User.findById(userId).select('name');
      
      await Notification.create({
        recipient: post.user._id,
        sender: userId,
        type: 'comment',
        post: post._id,
        message: `${commenter.name} commented on your post`
      });
      
      // Send real-time notification via Socket.io
      const io = global.io;
      const userSocketMap = global.userSocketMap;
      if (io && userSocketMap) {
        const recipientSocketId = userSocketMap.get(post.user._id.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('newNotification', {
            type: 'comment',
            message: `${commenter.name} commented on your post`
          });
        }
      }
    }
    
    const populatedPost = await Post.findById(post._id)
      .populate('user', 'name username email profilePicture')
      .populate('comments.user', 'name profilePicture')
      .populate('likes', 'name username profilePicture');
    
    // Emit real-time post update for comments
    const io = global.io;
    const userSocketMap = global.userSocketMap;
    if (io && userSocketMap) {
      const User = (await import('../models/User.js')).default;
      const postOwner = await User.findById(post.user._id).populate('friends', '_id');
      
      // Broadcast to post owner and their friends
      const broadcastTo = [post.user._id.toString(), ...postOwner.friends.map(f => f._id.toString())];
      broadcastTo.forEach(userId => {
        const socketId = userSocketMap.get(userId);
        if (socketId) {
          io.to(socketId).emit('postCommented', {
            postId: post._id,
            comments: populatedPost.comments,
            commentsCount: populatedPost.comments.length
          });
        }
      });
    }
    
    res.json(populatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get comments for a post
router.get("/:postId/comments", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('comments.user', 'name profilePicture')
      .populate('comments.replies.user', 'name profilePicture')
      .select('comments');
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like a comment
router.put("/:postId/comment/:commentId/like", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { postId, commentId } = req.params;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    const likeIndex = comment.likes.indexOf(userId);
    if (likeIndex > -1) {
      // Unlike
      comment.likes.splice(likeIndex, 1);
    } else {
      // Like
      comment.likes.push(userId);
      
      // Send notification if liking someone else's comment
      if (comment.user.toString() !== userId.toString()) {
        const Notification = (await import('../models/Notification.js')).default;
        const User = (await import('../models/User.js')).default;
        const liker = await User.findById(userId).select('name');
        
        await Notification.create({
          recipient: comment.user,
          sender: userId,
          type: 'like',
          post: post._id,
          message: `${liker.name} liked your comment`
        });
      }
    }
    
    await post.save();
    
    const populatedPost = await Post.findById(postId)
      .populate('comments.user', 'name profilePicture')
      .populate('comments.replies.user', 'name profilePicture');
    
    res.json(populatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reply to a comment
router.post("/:postId/comment/:commentId/reply", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { postId, commentId } = req.params;
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Reply text is required" });
    }
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    const newReply = {
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    };
    
    comment.replies.push(newReply);
    await post.save();
    
    // Send notification to comment owner
    if (comment.user.toString() !== userId.toString()) {
      const Notification = (await import('../models/Notification.js')).default;
      const User = (await import('../models/User.js')).default;
      const replier = await User.findById(userId).select('name');
      
      await Notification.create({
        recipient: comment.user,
        sender: userId,
        type: 'comment',
        post: post._id,
        message: `${replier.name} replied to your comment`
      });
    }
    
    const populatedPost = await Post.findById(postId)
      .populate('comments.user', 'name profilePicture')
      .populate('comments.replies.user', 'name profilePicture');
    
    res.json(populatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a comment
router.delete("/:postId/comment/:commentId", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { postId, commentId } = req.params;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    // Check if user is comment owner or post owner
    if (comment.user.toString() !== userId.toString() && post.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }
    
    comment.remove();
    await post.save();
    
    const populatedPost = await Post.findById(postId)
      .populate('comments.user', 'name profilePicture')
      .populate('comments.replies.user', 'name profilePicture');
    
    res.json(populatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a post
router.delete("/:postId", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }
    
    await Post.findByIdAndDelete(req.params.postId);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save/Bookmark a post
router.put("/:postId/save", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    const saveIndex = post.saves.findIndex(id => id.toString() === userId.toString());
    
    if (saveIndex > -1) {
      // Unsave
      post.saves.splice(saveIndex, 1);
    } else {
      // Save
      post.saves.push(userId);
    }
    
    await post.save();
    
    const isSaved = post.saves.some(id => id.toString() === userId.toString());
    res.json({ 
      message: isSaved ? "Post saved" : "Post unsaved",
      isSaved,
      savesCount: post.saves.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Share post to story
router.post("/:postId/share-to-story", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const post = await Post.findById(req.params.postId)
      .populate('user', 'name username profilePicture');
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Create a story with the shared post
    const Story = (await import('../models/Story.js')).default;
    
    const hasImage = post.images && post.images.length > 0;
    
    const story = new Story({
      user: userId,
      type: hasImage ? 'image' : 'text',
      content: {
        text: `Shared: ${post.content}`,
        mediaUrl: hasImage ? post.images[0] : null,
        backgroundColor: '#667eea'
      },
      sharedPost: post._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    
    await story.save();
    
    // Add to post shares
    if (!post.shares.includes(userId)) {
      post.shares.push(userId);
      await post.save();
    }
    
    const populatedStory = await Story.findById(story._id)
      .populate('user', 'name username profilePicture')
      .populate({
        path: 'sharedPost',
        populate: { path: 'user', select: 'name username profilePicture' }
      });
    
    res.status(201).json(populatedStory);
  } catch (err) {
    console.error('Share to story error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single post by ID (for sharing/preview) - Public route with optional auth
router.get("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('user', 'name username email profilePicture')
      .populate('likes', 'name username profilePicture')
      .populate({
        path: 'comments.user',
        select: 'name username profilePicture'
      });
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Return post data for preview/sharing
    res.json({
      id: post._id,
      content: post.content,
      images: post.images,
      user: {
        name: post.user.name,
        username: post.user.username,
        profilePicture: post.user.profilePicture
      },
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      createdAt: post.createdAt,
      // Meta data for Open Graph previews
      meta: {
        title: `${post.user.name}'s post`,
        description: post.content.substring(0, 160),
        image: post.images?.[0] || post.user.profilePicture || '',
        url: `${req.protocol}://${req.get('host')}/post/${post._id}`
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
