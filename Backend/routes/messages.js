import express from "express";
import { 
  getConversations, 
  getOrCreateConversation, 
  getMessages, 
  sendMessage, 
  deleteConversation,
  getUnreadCount,
  markAsSeen,
  sendImageMessage,
  deleteMessage,
  editMessage,
  addReaction,
  removeReaction,
  sendVoiceMessage,
  sendVideoMessage,
  sendDocument,
  forwardMessage
} from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";
import { upload, documentUpload, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// Get all conversations for logged in user
router.get("/conversations", protect, getConversations);

// Get or create conversation with specific user
router.get("/conversation/:participantId", protect, getOrCreateConversation);

// Get messages for a conversation
router.get("/:conversationId/messages", protect, getMessages);

// Send message in a conversation
router.post("/:conversationId/send", protect, sendMessage);

// Send image message
router.post("/:conversationId/send-image", protect, upload.single('image'), handleUploadError, sendImageMessage);

// Mark messages as seen
router.put("/:conversationId/seen", protect, markAsSeen);

// Delete a conversation
router.delete("/:conversationId", protect, deleteConversation);

// Delete a message
router.delete("/message/:messageId", protect, deleteMessage);

// Edit a message
router.put("/message/:messageId", protect, editMessage);

// Add reaction to message
router.post("/message/:messageId/reaction", protect, addReaction);

// Remove reaction from message
router.delete("/message/:messageId/reaction", protect, removeReaction);

// Send voice message
router.post("/:conversationId/send-voice", protect, upload.single('audio'), handleUploadError, sendVoiceMessage);

// Send video message
router.post("/:conversationId/send-video", protect, upload.single('video'), handleUploadError, sendVideoMessage);

// Send document/file message
router.post("/:conversationId/send-document", protect, documentUpload.single('document'), handleUploadError, sendDocument);

// Forward message
router.post("/message/:messageId/forward", protect, forwardMessage);

// Get unread message count
router.get("/unread/count", protect, getUnreadCount);

export default router;
