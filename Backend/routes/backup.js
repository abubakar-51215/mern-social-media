import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
  exportDatabase,
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup
} from '../controllers/backupController.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, isAdmin);

// Export database as JSON
router.get('/export', exportDatabase);

// Create backup
router.post('/create', createBackup);

// List all backups
router.get('/list', listBackups);

// Restore backup
router.post('/restore', restoreBackup);

// Delete backup
router.delete('/delete', deleteBackup);

export default router;
