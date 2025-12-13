import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../api';
import './NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const history = useHistory();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications(notifications.map(notif =>
        notif._id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications(notifications.filter(notif => notif._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === 'friend_request') {
      history.push('/connections');
    } else if (notification.type === 'message') {
      history.push('/messages');
    } else if (notification.post) {
      history.push(`/post/${notification.post}`);
    } else if (notification.type === 'story_like' || notification.type === 'story_reply') {
      history.push('/dashboard');
    }

    onClose();
  };

  const getNotificationIcon = (type) => {
    const icons = {
      like: '❤️',
      comment: '💬',
      follow: '👤',
      friend_request: '👥',
      friend_accept: '✅',
      story_like: '⭐',
      story_reply: '💭',
      message: '✉️'
    };
    return icons[type] || '🔔';
  };

  const formatTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return past.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="notification-center-overlay" onClick={onClose}>
      <div className="notification-center" onClick={(e) => e.stopPropagation()}>
        <div className="notification-center-header">
          <div className="notification-header-left">
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <div className="notification-header-actions">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
                Mark all as read
              </button>
            )}
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
        </div>

        <div className="notification-filters">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button 
            className={filter === 'unread' ? 'active' : ''} 
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button 
            className={filter === 'read' ? 'active' : ''} 
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        <div className="notification-center-content">
          {loading ? (
            <div className="notification-loading">
              <div className="spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="no-notifications-center">
              <div className="no-notif-icon">🔔</div>
              <h3>No notifications</h3>
              <p>
                {filter === 'unread' 
                  ? "You're all caught up!" 
                  : filter === 'read'
                  ? "No read notifications"
                  : "You don't have any notifications yet"}
              </p>
            </div>
          ) : (
            <div className="notification-list-center">
              {filteredNotifications.map(notif => (
                <div 
                  key={notif._id} 
                  className={`notification-item-center ${!notif.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-icon-wrapper">
                    {notif.sender?.profilePicture ? (
                      <img 
                        src={notif.sender.profilePicture.startsWith('http') ? notif.sender.profilePicture : `http://localhost:5000${notif.sender.profilePicture}`}
                        alt={notif.sender?.name}
                        className="notification-avatar-center"
                      />
                    ) : (
                      <div className="notification-icon-center">
                        {getNotificationIcon(notif.type)}
                      </div>
                    )}
                    {!notif.read && <div className="unread-dot"></div>}
                  </div>
                  
                  <div className="notification-content-center">
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time-center">{formatTime(notif.createdAt)}</span>
                  </div>

                  <button 
                    className="delete-notification-btn"
                    onClick={(e) => handleDelete(notif._id, e)}
                    title="Delete notification"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
