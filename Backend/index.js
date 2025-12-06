import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import passport from 'passport';
import session from 'express-session';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import friendRoutes from './routes/friends.js';
import postRoutes from './routes/posts.js';
import notificationRoutes from './routes/notifications.js';
import storyRoutes from './routes/stories.js';
import groupRoutes from './routes/groups.js';
import blockRoutes from './routes/block.js';
import settingsRoutes from './routes/settings.js';

// Import config
import './config/passport.js';
import connectDB from './config/db.js';
import { setSocketInstances } from './controllers/friendController.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Session configuration for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', blockRoutes);
app.use('/api/settings', settingsRoutes);

// Socket.io connection handling
const userSocketMap = new Map();
const typingUsers = new Map(); // Track typing status

io.on('connection', (socket) => {
  // User joins with their ID
  socket.on('join', async (userId) => {
    userSocketMap.set(userId, socket.id);
    socket.userId = userId;
    
    // Update user online status
    try {
      const User = (await import('./models/User.js')).default;
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        activityStatus: 'online',
        lastSeen: new Date()
      });
      
      // Broadcast online status to friends
      const user = await User.findById(userId).populate('friends', '_id');
      if (user && user.friends) {
        user.friends.forEach(friend => {
          const friendSocketId = userSocketMap.get(friend._id.toString());
          if (friendSocketId) {
            io.to(friendSocketId).emit('userOnline', { userId, lastSeen: new Date() });
          }
        });
      }
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  });

  // Activity status updates
  socket.on('updateActivityStatus', async (data) => {
    const { userId, status } = data;
    try {
      const User = (await import('./models/User.js')).default;
      await User.findByIdAndUpdate(userId, {
        activityStatus: status,
        lastSeen: new Date()
      });
      
      // Broadcast to friends
      const user = await User.findById(userId).populate('friends', '_id');
      if (user && user.friends) {
        user.friends.forEach(friend => {
          const friendSocketId = userSocketMap.get(friend._id.toString());
          if (friendSocketId) {
            io.to(friendSocketId).emit('activityStatusChanged', { userId, status });
          }
        });
      }
    } catch (error) {
      console.error('Error updating activity status:', error);
    }
  });

  // Message events
  socket.on('sendMessage', (data) => {
    const { conversationId, receiverId, message } = data;
    const recipientSocketId = userSocketMap.get(receiverId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receiveMessage', {
        conversationId,
        message
      });
    }
  });

  // Typing indicators
  socket.on('typing', async (data) => {
    const { conversationId, userId, userName } = data;
    
    // Get conversation to find the other participant
    try {
      const Conversation = (await import('./models/Conversation.js')).default;
      const conversation = await Conversation.findById(conversationId);
      
      if (conversation) {
        // Find the other participant
        const otherParticipantId = conversation.participants.find(
          p => p.toString() !== userId
        );
        
        if (otherParticipantId) {
          const recipientSocketId = userSocketMap.get(otherParticipantId.toString());
          
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('userTyping', {
              conversationId,
              userId,
              userName
            });
          }
        }
      }
    } catch (error) {
      console.error('Typing event error:', error);
    }
  });

  socket.on('stopTyping', async (data) => {
    const { conversationId, userId } = data;
    
    try {
      const Conversation = (await import('./models/Conversation.js')).default;
      const conversation = await Conversation.findById(conversationId);
      
      if (conversation) {
        const otherParticipantId = conversation.participants.find(
          p => p.toString() !== userId
        );
        
        if (otherParticipantId) {
          const recipientSocketId = userSocketMap.get(otherParticipantId.toString());
          
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('userStoppedTyping', {
              conversationId,
              userId
            });
          }
        }
      }
    } catch (error) {
      console.error('Stop typing event error:', error);
    }
  });

  // Messages seen
  socket.on('messagesSeen', async (data) => {
    const { conversationId, receiverId } = data;
    const userId = socket.userId;
    
    // Update messages in database to mark as read
    try {
      const Message = (await import('./models/Message.js')).default;
      await Message.updateMany(
        { 
          conversationId, 
          sender: receiverId, // Messages sent by the other user
          read: false 
        },
        { read: true }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
    
    const recipientSocketId = userSocketMap.get(receiverId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('messagesSeen', {
        conversationId
      });
    }
  });

  // Friend request events
  socket.on('sendFriendRequest', (data) => {
    const { receiverId, senderName } = data;
    const recipientSocketId = userSocketMap.get(receiverId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('friendRequestReceived', {
        senderName
      });
    }
  });

  socket.on('friendRequestAccepted', (data) => {
    const { senderId, accepterName } = data;
    const senderSocketId = userSocketMap.get(senderId);
    
    if (senderSocketId) {
      io.to(senderSocketId).emit('friendRequestAccepted', {
        accepterName
      });
    }
  });

  socket.on('friendRequestRejected', (data) => {
    const { senderId } = data;
    const senderSocketId = userSocketMap.get(senderId);
    
    if (senderSocketId) {
      io.to(senderSocketId).emit('friendRequestRejected', {});
    }
  });

  socket.on('disconnect', async () => {
    if (socket.userId) {
      // Update user offline status
      try {
        const User = (await import('./models/User.js')).default;
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          activityStatus: 'offline',
          lastSeen: new Date()
        });
        
        // Broadcast offline status to friends
        const user = await User.findById(socket.userId).populate('friends', '_id');
        if (user && user.friends) {
          user.friends.forEach(friend => {
            const friendSocketId = userSocketMap.get(friend._id.toString());
            if (friendSocketId) {
              io.to(friendSocketId).emit('userOffline', { userId: socket.userId, lastSeen: new Date() });
            }
          });
        }
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
      
      userSocketMap.delete(socket.userId);
    }
  });
});

// Initialize socket instances in friendController
setSocketInstances(io, userSocketMap);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});

// Export io instance for use in controllers
export { io, userSocketMap };
export default app;
