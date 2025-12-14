import mongoose from 'mongoose';

const ModerationActionSchema = new mongoose.Schema({
  actionType: {
    type: String,
    enum: [
      'delete_post',
      'delete_comment',
      'warn_user',
      'suspend_user',
      'ban_user',
      'unban_user',
      'remove_content',
      'restrict_posting',
      'unrestrict_posting'
    ],
    required: true
  },
  targetType: {
    type: String,
    enum: ['user', 'post', 'comment'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: null
  },
  reason: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
ModerationActionSchema.index({ moderatorId: 1, createdAt: -1 });
ModerationActionSchema.index({ targetId: 1, targetType: 1 });
ModerationActionSchema.index({ reportId: 1 });

const ModerationAction = mongoose.model('ModerationAction', ModerationActionSchema);

export default ModerationAction;
