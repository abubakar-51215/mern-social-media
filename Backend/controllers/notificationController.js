import Notification from '../models/Notification.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Admin sends notification to user
export const sendAdminNotification = async (req, res) => {
  try {
    const { recipientId, notificationType, message } = req.body;

    // Validate notification type
    const validTypes = ['admin_warning', 'admin_notice', 'admin_guidelines', 'admin_suspension', 'admin_custom'];
    if (!validTypes.includes(notificationType)) {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get sender ID - handle admin-001 token
    let senderId = req.user._id || req.user.id;
    if (senderId === 'admin-001') {
      // For hardcoded admin token, use a dummy ObjectId or skip sender
      senderId = null;
    }

    // Create notification
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId && mongoose.Types.ObjectId.isValid(senderId) ? senderId : null,
      type: notificationType,
      message: message,
      read: false
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
};

// Send bulk notification to multiple users
export const sendBulkNotification = async (req, res) => {
  try {
    const { userIds, notificationType, message } = req.body;

    // Validate notification type
    const validTypes = ['admin_warning', 'admin_notice', 'admin_guidelines', 'admin_suspension', 'admin_custom'];
    if (!validTypes.includes(notificationType)) {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    // Create notifications for each user
    const notifications = userIds.map(userId => ({
      recipient: userId,
      sender: req.user._id,
      type: notificationType,
      message: message,
      read: false
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `Notification sent to ${createdNotifications.length} users`,
      count: createdNotifications.length
    });
  } catch (error) {
    console.error('Bulk send notification error:', error);
    res.status(500).json({ message: 'Error sending bulk notification', error: error.message });
  }
};

// Get all notifications (for user)
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments({ recipient: req.user._id });

    res.json({
      success: true,
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Error marking notifications as read', error: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};
