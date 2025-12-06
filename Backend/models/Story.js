import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'question', 'poll'],
    required: true
  },
  content: {
    text: {
      type: String
    },
    backgroundColor: {
      type: String
    },
    mediaUrl: {
      type: String
    }
  },
  // Music feature
  music: {
    trackName: String,
    artistName: String,
    previewUrl: String,
    albumArt: String,
    duration: Number,
    startTime: { type: Number, default: 0 }
  },
  // Q&A Questions feature
  question: {
    text: String,
    answers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: String,
      createdAt: { type: Date, default: Date.now },
      isPublic: { type: Boolean, default: false }
    }]
  },
  // Poll feature
  poll: {
    question: String,
    options: [{
      text: String,
      votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    correctAnswer: {
      type: Number,
      default: null
    }
  },
  // Mentions/Tags
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    position: {
      x: Number,
      y: Number
    }
  }],
  // Close friends only
  isCloseFriendsOnly: {
    type: Boolean,
    default: false
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  sharedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Create index for automatic deletion of expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual to check if story is expired
storySchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

const Story = mongoose.model('Story', storySchema);

export default Story;
