import express from 'express';
import { 
  getAdminStats, 
  getAllUsers, 
  getUserDetails, 
  deleteUser, 
  toggleBlockUser, 
  toggleShadowBan, 
  warnUser,
  getAllPosts,
  getPostAnalytics,
  deletePost,
  markPostInappropriate,
  togglePostComments
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Admin user routes
router.get('/stats', protect, getAdminStats);
router.get('/users', protect, getAllUsers);
router.get('/users/:userId', protect, getUserDetails);
router.delete('/users/:userId', protect, deleteUser);
router.patch('/users/:userId/block', protect, toggleBlockUser);
router.patch('/users/:userId/shadow-ban', protect, toggleShadowBan);
router.post('/users/:userId/warn', protect, warnUser);

// Admin post routes
router.get('/posts', protect, getAllPosts);
router.get('/posts/:postId/analytics', protect, getPostAnalytics);
router.delete('/posts/:postId', protect, deletePost);
router.patch('/posts/:postId/inappropriate', protect, markPostInappropriate);
router.patch('/posts/:postId/comments', protect, togglePostComments);

export default router;
