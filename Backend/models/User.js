import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false,
    minlength: 6
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sentFriendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  coverPhoto: {
    type: String,
    default: ''
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  googleId: {
    type: String,
    sparse: true
  },
  secondaryEmails: [{
    address: {
      type: String,
      lowercase: true,
      trim: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  pendingEmailVerification: {
    email: String,
    code: String,
    expiresAt: Date
  },
  sessionVersion: {
    type: Number,
    default: 0
  },
  // Activity Status
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  activityStatus: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  showActivityStatus: {
    type: Boolean,
    default: true
  },
  // Verification Badge
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  // Login Activity / Sessions
  loginSessions: [{
    deviceInfo: {
      browser: String,
      os: String,
      device: String
    },
    ip: String,
    location: String,
    loginAt: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sessionToken: String
  }],
  // Close Friends
  closeFriends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Verification Request
  verificationRequest: {
    reason: String,
    category: String,
    links: [String],
    requestedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String
  },
  twoFactorBackupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  // Privacy Settings
  privacySettings: {
    whoCanMessage: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'everyone'
    },
    whoCanSeeOnlineStatus: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'everyone'
    },
    whoCanSeeLastSeen: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'everyone'
    },
    whoCanSeePosts: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'everyone'
    },
    whoCanSeeStories: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'everyone'
    },
    whoCanSeeFriends: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'everyone'
    },
    allowTagging: {
      type: Boolean,
      default: true
    },
    allowMentions: {
      type: Boolean,
      default: true
    }
  },
  // Notification Settings
  notificationSettings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    messageNotifications: {
      type: Boolean,
      default: true
    },
    likeNotifications: {
      type: Boolean,
      default: true
    },
    commentNotifications: {
      type: Boolean,
      default: true
    },
    followNotifications: {
      type: Boolean,
      default: true
    },
    friendRequestNotifications: {
      type: Boolean,
      default: true
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isShadowBanned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

export default User;
