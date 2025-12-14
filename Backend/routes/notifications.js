import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { sendAdminNotification, sendBulkNotification, getNotifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount } from '../controllers/notificationController.js';

const router = express.Router();

// Admin: Send notification to single user
router.post('/admin/send', protect, async (req, res) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Only admins can send notifications' });
  }
  await sendAdminNotification(req, res);
});

// Admin: Send bulk notification to multiple users
router.post('/admin/bulk', protect, async (req, res) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Only admins can send notifications' });
  }
  await sendBulkNotification(req, res);
});

// Get all notifications for the current user
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId || typeof userId !== 'string' || userId.length !== 24) {
      return res.json([]);
    }
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notification count
router.get('/unread/count', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId || typeof userId !== 'string' || userId.length !== 24) {
      return res.json({ count: 0 });
    }
    const count = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: userId
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
