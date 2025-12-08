import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
  images: [{ type: String }],
  videos: [{ 
    url: String,
    thumbnail: String,
    duration: Number
  }],
  location: { type: String },
  hashtags: [{ type: String }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  poll: {
    question: String,
    options: [{
      text: String,
      votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    endsAt: Date,
    allowMultipleAnswers: { type: Boolean, default: false }
  },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  music: {
    title: String,
    artist: String,
    album: String,
    duration: Number,
    previewUrl: String,
    albumArt: String,
    trackName: String,
    artistName: String
  },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date }
}, { timestamps: true });


export default mongoose.model("Post", PostSchema);

