import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'story_like', 'story_reply', 'story_answer', 'friend_request', 'friend_accept', 'message', 'mention', 'admin_warning', 'admin_notice', 'admin_guidelines', 'admin_suspension', 'admin_custom', 'moderation_action'],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ read: 1 });

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
