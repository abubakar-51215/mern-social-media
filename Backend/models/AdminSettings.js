import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema(
  {
    // General Settings
    platformName: {
      type: String,
      default: 'MERN Social Media'
    },
    platformDescription: {
      type: String,
      default: 'Connect, Share, and Build Relationships'
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },

    // Security Settings
    enableTwoFactor: {
      type: Boolean,
      default: true
    },
    passwordMinLength: {
      type: Number,
      default: 8,
      min: 6,
      max: 20
    },
    sessionTimeout: {
      type: Number,
      default: 24,
      min: 1,
      max: 168
    },
    rateLimitingEnabled: {
      type: Boolean,
      default: true
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 2,
      max: 20
    },

    // Moderation Settings
    autoModeration: {
      type: Boolean,
      default: true
    },
    reportThreshold: {
      type: Number,
      default: 5,
      min: 1,
      max: 50
    },
    autoSuspensionEnabled: {
      type: Boolean,
      default: true
    },
    suspensionAfterReports: {
      type: Number,
      default: 10,
      min: 1,
      max: 100
    },
    contentFilter: {
      type: Boolean,
      default: true
    },

    // Email Settings
    emailNotifications: {
      type: Boolean,
      default: true
    },
    notificationEmail: {
      type: String,
      default: 'admin@mern-social.com'
    },
    smtpEnabled: {
      type: Boolean,
      default: true
    },

    // Feature Settings
    enableStories: {
      type: Boolean,
      default: true
    },
    enableGroups: {
      type: Boolean,
      default: true
    },
    enableMessaging: {
      type: Boolean,
      default: true
    },
    enableReports: {
      type: Boolean,
      default: true
    },

    // Data Settings
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    logRetention: {
      type: Number,
      default: 90,
      min: 7,
      max: 365
    }
  },
  { timestamps: true }
);

export default mongoose.model('AdminSettings', adminSettingsSchema);
