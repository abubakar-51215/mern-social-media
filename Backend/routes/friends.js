import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend
} from '../controllers/friendController.js';

const router = express.Router();

// @route   POST /api/friends/request/:userId
// @desc    Send friend request
// @access  Private
router.post('/request/:userId', protect, sendFriendRequest);

// @route   PUT /api/friends/accept/:userId
// @desc    Accept friend request
// @access  Private
router.put('/accept/:userId', protect, acceptFriendRequest);

// @route   PUT /api/friends/reject/:userId
// @desc    Reject friend request
// @access  Private
router.put('/reject/:userId', protect, rejectFriendRequest);

// @route   DELETE /api/friends/remove/:userId
// @desc    Remove friend
// @access  Private
router.delete('/remove/:userId', protect, removeFriend);

// @route   GET /api/friends/requests
// @desc    Get pending friend requests
// @access  Private
router.get('/requests', protect, getFriendRequests);

// @route   GET /api/friends
// @desc    Get user's friends list
// @access  Private
router.get('/', protect, getFriends);

// @route   GET /api/friends/status/:userId
// @desc    Get friendship status with a user
// @access  Private
router.get('/status/:userId', protect, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;
    const User = (await import('../models/User.js')).default;
    
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);
    
    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if they are already friends
    if (currentUser.friends && currentUser.friends.some(f => f.toString() === targetUserId)) {
      return res.json({ status: 'friends' });
    }
    
    // Check if current user sent a request
    if (currentUser.sentFriendRequests && currentUser.sentFriendRequests.some(r => r.toString() === targetUserId)) {
      return res.json({ status: 'pending' });
    }
    
    // Check if target user sent a request to current user
    if (currentUser.friendRequests && currentUser.friendRequests.some(r => r.toString() === targetUserId)) {
      return res.json({ status: 'requested' });
    }
    
    return res.json({ status: 'none' });
  } catch (error) {
    console.error('Error getting friendship status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/friends/pending
// @desc    Get pending sent friend requests
// @access  Private
router.get('/pending', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId || typeof userId !== 'string' || userId.length !== 24) {
      return res.status(403).json({ message: 'Admin users cannot access pending requests' });
    }

    const user = await (await import('../models/User.js')).default.findById(userId).populate('sentFriendRequests', 'name email profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.sentFriendRequests || []);
  } catch (error) {
    console.error('Error getting pending requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
