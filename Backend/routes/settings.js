import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getSettings,
  updatePrivacySettings,
  updateNotificationSettings,
  setup2FA,
  verify2FA,
  disable2FA,
  validate2FALogin,
  getBackupCodes,
  changePassword,
  deleteAccount
} from '../controllers/settingsController.js';

const router = express.Router();

// @route   GET /api/settings
// @desc    Get user settings
// @access  Private
router.get('/', protect, getSettings);

// @route   PUT /api/settings/privacy
// @desc    Update privacy settings
// @access  Private
router.put('/privacy', protect, updatePrivacySettings);

// @route   PUT /api/settings/notifications
// @desc    Update notification settings
// @access  Private
router.put('/notifications', protect, updateNotificationSettings);

// @route   POST /api/settings/2fa/setup
// @desc    Setup 2FA - get QR code
// @access  Private
router.post('/2fa/setup', protect, setup2FA);

// @route   POST /api/settings/2fa/verify
// @desc    Verify and enable 2FA
// @access  Private
router.post('/2fa/verify', protect, verify2FA);

// @route   POST /api/settings/2fa/disable
// @desc    Disable 2FA
// @access  Private
router.post('/2fa/disable', protect, disable2FA);

// @route   POST /api/settings/2fa/validate
// @desc    Validate 2FA token during login
// @access  Public
router.post('/2fa/validate', validate2FALogin);

// @route   POST /api/settings/2fa/backup-codes
// @desc    Get new backup codes
// @access  Private
router.post('/2fa/backup-codes', protect, getBackupCodes);

// @route   PUT /api/settings/password
// @desc    Change password
// @access  Private
router.put('/password', protect, changePassword);

// @route   DELETE /api/settings/account
// @desc    Delete account
// @access  Private
router.delete('/account', protect, deleteAccount);

export default router;
