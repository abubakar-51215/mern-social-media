import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { encryptMessage, decryptMessage } from "../utils/encryption.js";

// Helper function to decrypt messages
const decryptMessages = (messages) => {
  return messages.map(msg => {
    if (msg.isEncrypted && msg.text) {
      const decryptedText = decryptMessage(msg.text);
      return {
        ...msg.toObject ? msg.toObject() : msg,
        text: decryptedText
      };
    }
    return msg.toObject ? msg.toObject() : msg;
  });
};

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', '_id name email profilePicture isOnline lastSeen activityStatus')
      .sort({ lastMessageTime: -1 });

    // Format conversations with the other participant's info and unread count
    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      const otherParticipant = conv.participants.find(p => p._id.toString() !== userId);
      
      // Count unread messages in this conversation
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        sender: { $ne: userId },
        read: false
      });
      
      return {
        _id: conv._id,
        participant: otherParticipant,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        createdAt: conv.createdAt,
        unreadCount
      };
    }));

    res.json(formattedConversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get or create a conversation between two users
export const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { participantId } = req.params;

    // Check if both users exist
    const currentUser = await User.findById(userId);
    const otherUser = await User.findById(participantId);

    if (!currentUser || !otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if they are friends
    const areFriends = currentUser.friends.some(
      friendId => friendId.toString() === participantId
    );

    // Check if the other user's account is private
    // If private and not friends, cannot message
    if (otherUser.isPrivate && !areFriends) {
      return res.status(403).json({ 
        message: "This account is private. You need to be friends to send messages.",
        isPrivate: true,
        requiresFriendship: true
      });
    }

    // If public profile, anyone can message (no friendship required)
    // If private profile but friends, allow messaging

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] }
    }).populate('participants', 'name email profilePicture isOnline lastSeen activityStatus isPrivate');

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [userId, participantId]
      });
      
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email profilePicture isOnline lastSeen activityStatus');
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name email profilePicture')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { conversationId, sender: { $ne: userId }, read: false },
      { read: true }
    );

    // Decrypt messages before sending
    const decryptedMessages = decryptMessages(messages);

    res.json(decryptedMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, encrypted = true } = req.body;
    const userId = req.user.id;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Encrypt message if enabled
    const encryptedText = encrypted && text ? encryptMessage(text) : text;

    // Create message
    const message = await Message.create({
      conversationId,
      sender: userId,
      text: encryptedText,
      isEncrypted: encrypted && !!text
    });

    // Update conversation's last message (store preview as truncated plain text)
    const messagePreview = text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : '';
    conversation.lastMessage = messagePreview;
    conversation.lastMessageTime = new Date();
    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'name email profilePicture');

    // Prepare decrypted message for socket emission
    const messageForSocket = {
      ...message.toObject(),
      text: text // Send original text through socket for real-time display
    };

    // Emit socket event to receiver
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const receiverId = conversation.participants.find(p => p.toString() !== userId);
    
    if (io && onlineUsers && receiverId) {
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', {
          conversationId,
          message: messageForSocket
        });
        // Also emit conversation update for sidebar
        io.to(receiverSocketId).emit('conversationUpdated', {
          conversationId,
          lastMessage: messagePreview,
          lastMessageTime: conversation.lastMessageTime
        });
      }
    }

    // Return decrypted message to sender
    res.status(201).json(messageForSocket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a conversation
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId });
    
    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId
    });

    const conversationIds = conversations.map(c => c._id);

    const unreadCount = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      sender: { $ne: userId },
      read: false
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark messages as seen
export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update messages to seen
    const result = await Message.updateMany(
      { 
        conversationId, 
        sender: { $ne: userId }, 
        read: false 
      },
      { 
        read: true,
        seenAt: new Date()
      }
    );

    // Emit socket event to sender
    const io = req.app.get('io');
    const senderId = conversation.participants.find(p => p.toString() !== userId);
    if (io && senderId) {
      const onlineUsers = req.app.get('onlineUsers');
      const senderSocketId = onlineUsers.get(senderId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit('messagesSeen', {
          conversationId,
          seenBy: userId
        });
      }
    }

    res.json({ message: 'Messages marked as seen', count: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send image message
export const sendImageMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get uploaded file path
    const imagePath = req.file ? `/uploads/messages/${req.file.filename}` : null;

    if (!imagePath) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    // Determine message type
    let messageType = 'image';
    if (text) {
      messageType = 'mixed';
    }

    // Create message
    const message = await Message.create({
      conversationId,
      sender: userId,
      text: text || '',
      image: imagePath,
      messageType
    });

    // Update conversation's last message
    conversation.lastMessage = text || '📷 Photo';
    conversation.lastMessageTime = new Date();
    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'name email profilePicture username');

    // Emit socket event to receiver
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const receiverId = conversation.participants.find(p => p.toString() !== userId);
    
    if (io && onlineUsers && receiverId) {
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', {
          conversationId,
          message
        });
        io.to(receiverSocketId).emit('conversationUpdated', {
          conversationId,
          lastMessage: conversation.lastMessage,
          lastMessageTime: conversation.lastMessageTime
        });
      }
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.text = 'This message was deleted';
    message.image = '';
    message.video = '';
    message.audio = '';
    message.file = '';
    message.fileName = '';
    message.fileSize = 0;
    await message.save();

    // Emit socket event
    const io = req.app.get('io');
    const conversation = await Conversation.findById(message.conversationId);
    const receiverId = conversation.participants.find(p => p.toString() !== userId);
    if (io && receiverId) {
      const onlineUsers = req.app.get('onlineUsers');
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('messageDeleted', {
          messageId,
          conversationId: message.conversationId
        });
      }
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can edit
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    // Can't edit deleted messages
    if (message.isDeleted) {
      return res.status(400).json({ message: 'Cannot edit deleted message' });
    }

    // Can only edit text messages
    if (message.messageType !== 'text') {
      return res.status(400).json({ message: 'Can only edit text messages' });
    }

    // Check if message is within edit time window (10 minutes)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const maxEditTime = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    if (messageAge > maxEditTime) {
      return res.status(400).json({ message: 'Cannot edit message after 10 minutes' });
    }

    message.text = text.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'name email profilePicture');

    // Emit socket event
    const io = req.app.get('io');
    const conversation = await Conversation.findById(message.conversationId);
    const receiverId = conversation.participants.find(p => p.toString() !== userId);
    if (io && receiverId) {
      const onlineUsers = req.app.get('onlineUsers');
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('messageEdited', {
          messageId,
          text: message.text,
          isEdited: true,
          editedAt: message.editedAt,
          conversationId: message.conversationId
        });
      }
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add reaction to message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user already reacted
    const existingReaction = message.reactions.find(
      r => r.user.toString() === userId
    );

    if (existingReaction) {
      // Update existing reaction
      existingReaction.emoji = emoji;
    } else {
      // Add new reaction
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();
    await message.populate('reactions.user', 'name profilePicture');

    // Emit socket event
    const io = req.app.get('io');
    const conversation = await Conversation.findById(message.conversationId);
    const receiverId = conversation.participants.find(p => p.toString() !== userId);
    if (io && receiverId) {
      const onlineUsers = req.app.get('onlineUsers');
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('reactionAdded', {
          messageId,
          reaction: message.reactions[message.reactions.length - 1],
          conversationId: message.conversationId
        });
      }
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove reaction from message
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.reactions = message.reactions.filter(
      r => r.user.toString() !== userId
    );

    await message.save();

    // Emit socket event
    const io = req.app.get('io');
    const conversation = await Conversation.findById(message.conversationId);
    const receiverId = conversation.participants.find(p => p.toString() !== userId);
    if (io && receiverId) {
      const onlineUsers = req.app.get('onlineUsers');
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('reactionRemoved', {
          messageId,
          userId,
          conversationId: message.conversationId
        });
      }
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send voice message
export const sendVoiceMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const audioPath = req.file ? `/uploads/messages/${req.file.filename}` : null;
    if (!audioPath) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    // Store file size for duration estimation
    const fileSize = req.file ? req.file.size : 0;

    const message = await Message.create({
      conversationId,
      sender: userId,
      audio: audioPath,
      fileSize: fileSize,
      messageType: 'audio'
    });

    conversation.lastMessage = '🎤 Voice message';
    conversation.lastMessageTime = new Date();
    await conversation.save();

    await message.populate('sender', 'name email profilePicture');

    // Emit socket event to receiver
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const receiverId = conversation.participants.find(p => p.toString() !== userId);
    
    if (io && onlineUsers && receiverId) {
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', {
          conversationId,
          message
        });
        // Also emit conversation update
        io.to(receiverSocketId).emit('conversationUpdated', {
          conversationId,
          lastMessage: '🎤 Voice message',
          lastMessageTime: conversation.lastMessageTime
        });
      }
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send video message
export const sendVideoMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const videoPath = req.file ? `/uploads/messages/${req.file.filename}` : null;
    if (!videoPath) {
      return res.status(400).json({ message: "No video file uploaded" });
    }

    const message = await Message.create({
      conversationId,
      sender: userId,
      text: text || '',
      video: videoPath,
      messageType: text ? 'mixed' : 'video'
    });

    conversation.lastMessage = text || '🎥 Video';
    conversation.lastMessageTime = new Date();
    await conversation.save();

    await message.populate('sender', 'name email profilePicture');

    // Emit socket event to receiver
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const receiverId = conversation.participants.find(p => p.toString() !== userId);
    
    if (io && onlineUsers && receiverId) {
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', {
          conversationId,
          message
        });
        io.to(receiverSocketId).emit('conversationUpdated', {
          conversationId,
          lastMessage: conversation.lastMessage,
          lastMessageTime: conversation.lastMessageTime
        });
      }
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send document/file message
export const sendDocument = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const filePath = req.file ? `/uploads/documents/${req.file.filename}` : null;
    if (!filePath) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Get file info
    const fileName = req.file.originalname;
    const fileSize = req.file.size;

    const message = await Message.create({
      conversationId,
      sender: userId,
      text: text || '',
      file: filePath,
      fileName: fileName,
      fileSize: fileSize,
      messageType: 'file'
    });

    conversation.lastMessage = `📎 ${fileName}`;
    conversation.lastMessageTime = new Date();
    await conversation.save();

    await message.populate('sender', 'name email profilePicture');

    // Emit socket event to receiver
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const receiverId = conversation.participants.find(p => p.toString() !== userId);
    
    if (io && onlineUsers && receiverId) {
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', {
          conversationId,
          message
        });
        io.to(receiverSocketId).emit('conversationUpdated', {
          conversationId,
          lastMessage: conversation.lastMessage,
          lastMessageTime: conversation.lastMessageTime
        });
      }
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Forward message
export const forwardMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { conversationIds } = req.body;
    const userId = req.user.id;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const forwardedMessages = [];

    for (const conversationId of conversationIds) {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(userId)) {
        continue;
      }

      const newMessage = await Message.create({
        conversationId,
        sender: userId,
        text: originalMessage.text,
        image: originalMessage.image,
        video: originalMessage.video,
        audio: originalMessage.audio,
        messageType: originalMessage.messageType
      });

      conversation.lastMessage = originalMessage.text || '📤 Forwarded message';
      conversation.lastMessageTime = new Date();
      await conversation.save();

      await newMessage.populate('sender', 'name email profilePicture');
      forwardedMessages.push(newMessage);

      // Emit socket event to receiver
      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers');
      const receiverId = conversation.participants.find(p => p.toString() !== userId);
      
      if (io && onlineUsers && receiverId) {
        const receiverSocketId = onlineUsers.get(receiverId.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', {
            conversationId,
            message: newMessage
          });
          io.to(receiverSocketId).emit('conversationUpdated', {
            conversationId,
            lastMessage: conversation.lastMessage,
            lastMessageTime: conversation.lastMessageTime
          });
        }
      }
    }

    res.status(201).json({ 
      message: 'Message forwarded successfully',
      forwardedMessages 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
