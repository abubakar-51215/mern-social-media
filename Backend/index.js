import fs from 'fs';
import path from 'path';
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
import adminRoutes from './routes/admin.js';
import reportRoutes from './routes/reports.js';
import analyticsRoutes from './routes/analytics.js';
import adminSettingsRoutes from './routes/adminSettings.js';
import backupRoutes from './routes/backup.js';

// Import config
import './config/passport.js';
import connectDB from './config/db.js';
import { setSocketInstances } from './controllers/friendController.js';
import { checkMaintenance } from './middleware/maintenance.js';

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

// Audio streaming middleware - must come before static file serve
app.get('/uploads/messages/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', 'messages', filename);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(path.join(process.cwd(), 'uploads'))) {
    return res.status(403).send('Forbidden');
  }
  
  // Check if file exists
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      console.log(`❌ Audio file not found: ${filePath}`);
      return res.status(404).send('File not found');
    }

    const isAudio = /\.(webm|wav|ogg|mp3|m4a|aac)$/i.test(filename);
    
    if (isAudio) {
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        '.webm': 'audio/webm',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.mp3': 'audio/mpeg',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac'
      };
      
      const mimeType = mimeTypes[ext] || 'audio/webm';
      const fileSize = stat.size;
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Disposition', 'inline');
      
      // Log audio streaming only if in development
      if (process.env.NODE_ENV !== 'production') {
        // Uncomment for debugging: console.log(`✅ Streaming audio: ${filename} (${(fileSize/1024).toFixed(2)} KB)`);
      }
      
      // Support range requests for streaming
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        if (start >= fileSize) {
          res.status(416).send('Requested Range Not Satisfiable');
          return;
        }
        
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Content-Length', (end - start + 1));
        fs.createReadStream(filePath, { start, end }).pipe(res);
      } else {
        fs.createReadStream(filePath).pipe(res);
      }
    } else {
      // For non-audio files, use express static
      express.static('uploads')(req, res);
    }
  });
});

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

// Apply maintenance mode check to all user routes (except auth and admin)
app.use('/api/users', checkMaintenance, userRoutes);
app.use('/api/messages', checkMaintenance, messageRoutes);
app.use('/api/friends', checkMaintenance, friendRoutes);
app.use('/api/posts', checkMaintenance, postRoutes);
app.use('/api/notifications', checkMaintenance, notificationRoutes);
app.use('/api/stories', checkMaintenance, storyRoutes);
app.use('/api/groups', checkMaintenance, groupRoutes);
app.use('/api/users', checkMaintenance, blockRoutes);
app.use('/api/settings', checkMaintenance, settingsRoutes);

// Admin routes (not affected by maintenance mode)
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin-settings', adminSettingsRoutes);
app.use('/api/backup', backupRoutes);

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
            // Skip if not a valid ObjectId (e.g., admin-001)
            if (!userId || typeof userId !== 'string' || userId.length !== 24) {
              return;
            }
      
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
              // Skip if not a valid ObjectId (e.g., admin-001)
              if (typeof socket.userId !== 'string' || socket.userId.length !== 24) {
                userSocketMap.delete(socket.userId);
                return;
              }
        
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

// Make io and userSocketMap accessible via req.app.get()
app.set('io', io);
app.set('onlineUsers', userSocketMap);

// Make io globally accessible to controllers
global.io = io;
global.userSocketMap = userSocketMap;

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});

// Export io instance for use in controllers
export { io, userSocketMap };
export default app;
