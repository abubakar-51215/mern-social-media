import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
  getAdminSettings,
  updateAdminSettings,
  resetAdminSettings
} from '../controllers/adminSettingsController.js';

const router = express.Router();

// @route   GET /api/admin-settings/public
// @desc    Get public admin settings (platform name, description)
// @access  Public
router.get('/public', getAdminSettings);

// @route   GET /api/admin-settings
// @desc    Get all admin settings
// @access  Private/Admin
router.get('/', protect, isAdmin, getAdminSettings);

// @route   PUT /api/admin-settings
// @desc    Update admin settings
// @access  Private/Admin
router.put('/', protect, isAdmin, updateAdminSettings);

// @route   POST /api/admin-settings/reset
// @desc    Reset admin settings to defaults
// @access  Private/Admin
router.post('/reset', protect, isAdmin, resetAdminSettings);

export default router;
