import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  isUserBlocked
} from '../controllers/blockController.js';

const router = express.Router();

// @route   POST /api/users/block/:userId
// @desc    Block a user
// @access  Private
router.post('/block/:userId', protect, blockUser);

// @route   DELETE /api/users/unblock/:userId
// @desc    Unblock a user
// @access  Private
router.delete('/unblock/:userId', protect, unblockUser);

// @route   GET /api/users/blocked
// @desc    Get blocked users list
// @access  Private
router.get('/blocked', protect, getBlockedUsers);

// @route   GET /api/users/blocked/:userId
// @desc    Check if a user is blocked
// @access  Private
router.get('/blocked/:userId', protect, isUserBlocked);

export default router;
