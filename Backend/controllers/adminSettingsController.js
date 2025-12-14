import AdminSettings from '../models/AdminSettings.js';

// Get all admin settings
export const getAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await AdminSettings.create({});
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ message: 'Server error fetching settings' });
  }
};

// Update admin settings
export const updateAdminSettings = async (req, res) => {
  try {
    const {
      platformName,
      platformDescription,
      maintenanceMode,
      enableTwoFactor,
      passwordMinLength,
      sessionTimeout,
      rateLimitingEnabled,
      maxLoginAttempts,
      autoModeration,
      reportThreshold,
      autoSuspensionEnabled,
      suspensionAfterReports,
      contentFilter,
      emailNotifications,
      notificationEmail,
      smtpEnabled,
      enableStories,
      enableGroups,
      enableMessaging,
      enableReports,
      backupFrequency,
      logRetention
    } = req.body;

    // Validate email
    if (notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Validate numeric fields
    if (passwordMinLength && (passwordMinLength < 6 || passwordMinLength > 20)) {
      return res.status(400).json({ message: 'Password length must be between 6 and 20' });
    }

    if (sessionTimeout && (sessionTimeout < 1 || sessionTimeout > 168)) {
      return res.status(400).json({ message: 'Session timeout must be between 1 and 168 hours' });
    }

    if (maxLoginAttempts && (maxLoginAttempts < 2 || maxLoginAttempts > 20)) {
      return res.status(400).json({ message: 'Max login attempts must be between 2 and 20' });
    }

    if (reportThreshold && (reportThreshold < 1 || reportThreshold > 50)) {
      return res.status(400).json({ message: 'Report threshold must be between 1 and 50' });
    }

    if (suspensionAfterReports && (suspensionAfterReports < 1 || suspensionAfterReports > 100)) {
      return res.status(400).json({ message: 'Suspension threshold must be between 1 and 100' });
    }

    if (logRetention && (logRetention < 7 || logRetention > 365)) {
      return res.status(400).json({ message: 'Log retention must be between 7 and 365 days' });
    }

    if (backupFrequency && !['daily', 'weekly', 'monthly'].includes(backupFrequency)) {
      return res.status(400).json({ message: 'Invalid backup frequency' });
    }

    let settings = await AdminSettings.findOne();
    
    if (!settings) {
      settings = await AdminSettings.create({});
    }

    // Update all provided fields
    const updateData = {};
    
    if (platformName !== undefined) updateData.platformName = platformName;
    if (platformDescription !== undefined) updateData.platformDescription = platformDescription;
    if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode;
    if (enableTwoFactor !== undefined) updateData.enableTwoFactor = enableTwoFactor;
    if (passwordMinLength !== undefined) updateData.passwordMinLength = passwordMinLength;
    if (sessionTimeout !== undefined) updateData.sessionTimeout = sessionTimeout;
    if (rateLimitingEnabled !== undefined) updateData.rateLimitingEnabled = rateLimitingEnabled;
    if (maxLoginAttempts !== undefined) updateData.maxLoginAttempts = maxLoginAttempts;
    if (autoModeration !== undefined) updateData.autoModeration = autoModeration;
    if (reportThreshold !== undefined) updateData.reportThreshold = reportThreshold;
    if (autoSuspensionEnabled !== undefined) updateData.autoSuspensionEnabled = autoSuspensionEnabled;
    if (suspensionAfterReports !== undefined) updateData.suspensionAfterReports = suspensionAfterReports;
    if (contentFilter !== undefined) updateData.contentFilter = contentFilter;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (notificationEmail !== undefined) updateData.notificationEmail = notificationEmail;
    if (smtpEnabled !== undefined) updateData.smtpEnabled = smtpEnabled;
    if (enableStories !== undefined) updateData.enableStories = enableStories;
    if (enableGroups !== undefined) updateData.enableGroups = enableGroups;
    if (enableMessaging !== undefined) updateData.enableMessaging = enableMessaging;
    if (enableReports !== undefined) updateData.enableReports = enableReports;
    if (backupFrequency !== undefined) updateData.backupFrequency = backupFrequency;
    if (logRetention !== undefined) updateData.logRetention = logRetention;

    Object.assign(settings, updateData);
    await settings.save();

    res.json({
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({ message: 'Server error updating settings' });
  }
};

// Reset settings to defaults
export const resetAdminSettings = async (req, res) => {
  try {
    await AdminSettings.deleteMany({});
    const settings = await AdminSettings.create({});

    res.json({
      message: 'Settings reset to defaults successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error resetting admin settings:', error);
    res.status(500).json({ message: 'Server error resetting settings' });
  }
};
