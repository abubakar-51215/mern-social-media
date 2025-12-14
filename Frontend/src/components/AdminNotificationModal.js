import React, { useState } from 'react';
import './AdminNotificationModal.css';
import { sendAdminNotification } from '../api';

const AdminNotificationModal = ({ userId, userName, onClose, onSuccess }) => {
  const [notificationType, setNotificationType] = useState('admin_warning');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const notificationTypes = [
    { value: 'admin_warning', label: '⚠️ Warning Message', icon: '⚠️' },
    { value: 'admin_notice', label: '📢 Official Notice', icon: '📢' },
    { value: 'admin_guidelines', label: '📋 Community Guidelines Violation', icon: '📋' },
    { value: 'admin_suspension', label: '🚫 Account Suspension Notice', icon: '🚫' },
    { value: 'admin_custom', label: '💬 Custom Message', icon: '💬' }
  ];

  const templates = {
    admin_warning: '[From Admin] ⚠️ We noticed some activity on your account that violates our community guidelines. Please review our policies.',
    admin_notice: '[From Admin] 📢 Important announcement from our community moderators.',
    admin_guidelines: '[From Admin] 📋 Your recent action violated our Community Guidelines. Please refrain from such activities in the future.',
    admin_suspension: '[From Admin] 🚫 Your account has been temporarily suspended due to repeated violations. Contact support for more information.',
    admin_custom: '[From Admin] '
  };

  const handleTypeChange = (type) => {
    setNotificationType(type);
    setMessage(templates[type] || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendAdminNotification({
        recipientId: userId,
        notificationType,
        message: message.trim()
      });

      if (onSuccess) {
        onSuccess(`Notification sent to ${userName}`);
      }

      // Reset form
      setMessage('');
      setNotificationType('admin_warning');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send Notification to {userName}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="notification-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Notification Type</label>
            <div className="notification-types">
              {notificationTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  className={`type-button ${notificationType === type.value ? 'active' : ''}`}
                  onClick={() => handleTypeChange(type.value)}
                  title={type.label}
                >
                  <span className="type-icon">{type.icon}</span>
                  <span className="type-label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your notification message..."
              rows={6}
              maxLength={500}
              required
            />
            <div className="char-count">{message.length}/500</div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="send-btn" disabled={loading || !message.trim()}>
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminNotificationModal;
