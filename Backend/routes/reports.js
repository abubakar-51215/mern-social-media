import express from 'express';
import { 
  createReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  takeModerationAction,
  getModerationHistory,
  getReportStats,
  cleanupDuplicateActions
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'Unauthorized: Admin access required' });
};

// User routes (authenticated users can create reports)
router.post('/', protect, createReport);

// Admin routes
router.get('/', protect, isAdmin, getAllReports);
router.get('/stats', protect, isAdmin, getReportStats);
router.get('/history', protect, isAdmin, getModerationHistory);
router.get('/cleanup/duplicates', protect, isAdmin, cleanupDuplicateActions);
router.get('/:id', protect, isAdmin, getReportById);
router.patch('/:id/status', protect, isAdmin, updateReportStatus);
router.post('/moderate', protect, isAdmin, takeModerationAction);

export default router;
