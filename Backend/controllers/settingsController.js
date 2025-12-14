import User from '../models/User.js';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Get user settings
export const getSettings = async (req, res) => {
  try {
    // Check if userId is a valid ObjectId
    if (!req.user.id || typeof req.user.id !== 'string' || req.user.id.length !== 24) {
      return res.status(403).json({ message: 'Admin users cannot access user settings' });
    }

    const user = await User.findById(req.user.id)
      .select('isPrivate showActivityStatus privacySettings notificationSettings twoFactorEnabled');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      isPrivate: user.isPrivate,
      showActivityStatus: user.showActivityStatus,
      privacySettings: user.privacySettings || {},
      notificationSettings: user.notificationSettings || {},
      twoFactorEnabled: user.twoFactorEnabled || false
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update privacy settings
export const updatePrivacySettings = async (req, res) => {
  try {
    const { isPrivate, showActivityStatus, privacySettings } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (typeof isPrivate === 'boolean') {
      user.isPrivate = isPrivate;
    }
    
    if (typeof showActivityStatus === 'boolean') {
      user.showActivityStatus = showActivityStatus;
    }

    if (privacySettings) {
      user.privacySettings = {
        ...user.privacySettings,
        ...privacySettings
      };
    }

    await user.save();

    res.json({
      message: 'Privacy settings updated',
      isPrivate: user.isPrivate,
      showActivityStatus: user.showActivityStatus,
      privacySettings: user.privacySettings
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req, res) => {
  try {
    const { notificationSettings } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (notificationSettings) {
      user.notificationSettings = {
        ...user.notificationSettings,
        ...notificationSettings
      };
    }

    await user.save();

    res.json({
      message: 'Notification settings updated',
      notificationSettings: user.notificationSettings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Setup 2FA - Generate secret and QR code
export const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `PingUp (${user.email})`,
      length: 32
    });

    // Store secret temporarily (not enabled yet)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify and enable 2FA
export const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: 'Please setup 2FA first' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push({
        code: crypto.randomBytes(4).toString('hex').toUpperCase(),
        used: false
      });
    }

    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = backupCodes;
    await user.save();

    res.json({
      message: '2FA enabled successfully',
      backupCodes: backupCodes.map(bc => bc.code)
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Disable 2FA
export const disable2FA = async (req, res) => {
  try {
    const { password, token } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify password (if user has password)
    if (user.password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }
    }

    // Verify 2FA token OR backup code
    let verified = false;
    
    // Try TOTP first
    verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    // If TOTP fails, check backup codes
    if (!verified) {
      const backupCode = user.twoFactorBackupCodes.find(
        bc => bc.code === token.toUpperCase() && !bc.used
      );
      if (backupCode) {
        verified = true;
      }
    }

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validate 2FA during login
export const validate2FALogin = async (req, res) => {
  try {
    const { email, token } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled for this user' });
    }

    // Verify TOTP
    let verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    // If TOTP fails, check backup codes
    if (!verified) {
      const backupCodeIndex = user.twoFactorBackupCodes.findIndex(
        bc => bc.code === token.toUpperCase() && !bc.used
      );
      if (backupCodeIndex !== -1) {
        verified = true;
        // Mark backup code as used
        user.twoFactorBackupCodes[backupCodeIndex].used = true;
        await user.save();
      }
    }

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    res.json({ verified: true });
  } catch (error) {
    console.error('Error validating 2FA:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get new backup codes
export const getBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify password
    if (user.password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }
    }

    // Generate new backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push({
        code: crypto.randomBytes(4).toString('hex').toUpperCase(),
        used: false
      });
    }

    user.twoFactorBackupCodes = backupCodes;
    await user.save();

    res.json({
      message: 'New backup codes generated',
      backupCodes: backupCodes.map(bc => bc.code)
    });
  } catch (error) {
    console.error('Error generating backup codes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user has a password, verify current password
    if (user.password) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    user.password = newPassword;
    user.sessionVersion = (user.sessionVersion || 0) + 1; // Invalidate other sessions
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete account
export const deleteAccount = async (req, res) => {
  try {
    const { password, confirmation } = req.body;
    
    if (confirmation !== 'DELETE') {
      return res.status(400).json({ message: 'Please type DELETE to confirm' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password if exists
    if (user.password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }
    }

    // Delete user and all related data
    await User.findByIdAndDelete(req.user.id);

    // TODO: Delete user's posts, comments, messages, etc.

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
