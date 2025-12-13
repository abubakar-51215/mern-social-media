import mongoose from "mongoose";

// Define the schema for messages
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: function() {
        return !this.groupId; // Required only if not a group message
      }
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupConversation"
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: ''
    },
    isEncrypted: {
      type: Boolean,
      default: false
    },
    encryptionVersion: {
      type: String,
      default: '1.0'
    },
    image: {
      type: String,
      default: ''
    },
    video: {
      type: String,
      default: ''
    },
    audio: {
      type: String,
      default: ''
    },
    file: {
      type: String,
      default: ''
    },
    fileName: {
      type: String,
      default: ''
    },
    fileSize: {
      type: Number,
      default: 0
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'mixed'],
      default: 'text'
    },
    read: {
      type: Boolean,
      default: false
    },
    seenAt: {
      type: Date
    },
    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      emoji: String,
      createdAt: { type: Date, default: Date.now }
    }],
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    isStoryReply: {
      type: Boolean,
      default: false
    },
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      default: null
    },
    questionText: {
      type: String,
      default: null
    }
  },
  { timestamps: true } // adds createdAt and updatedAt
);

// Export the model
const Message = mongoose.model("Message", messageSchema);
export default Message;
