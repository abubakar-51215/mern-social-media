import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['post', 'user'],
    required: true
  },
  reportedItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'reportType'
  },
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'nudity',
      'misinformation',
      'copyright',
      'self_harm',
      'terrorism',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  resolution: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
ReportSchema.index({ status: 1, priority: -1, createdAt: -1 });
ReportSchema.index({ reporterId: 1, reportedItemId: 1, reportType: 1 });

const Report = mongoose.model('Report', ReportSchema);

export default Report;
