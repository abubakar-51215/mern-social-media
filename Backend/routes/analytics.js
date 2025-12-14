import express from 'express';
import {
  getNewUsersPerDay,
  getNewPostsPerDay,
  getRetentionRate,
  getMostActiveUsers,
  getMostLikedPosts,
  getMostReportedPosts,
  getPlatformStats
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'Unauthorized: Admin access required' });
};

// Analytics routes (all require admin access)
router.get('/platform/stats', protect, isAdmin, getPlatformStats);
router.get('/users/new-per-day', protect, isAdmin, getNewUsersPerDay);
router.get('/posts/new-per-day', protect, isAdmin, getNewPostsPerDay);
router.get('/retention-rate', protect, isAdmin, getRetentionRate);
router.get('/users/most-active', protect, isAdmin, getMostActiveUsers);
router.get('/posts/most-liked', protect, isAdmin, getMostLikedPosts);
router.get('/posts/most-reported', protect, isAdmin, getMostReportedPosts);

export default router;
