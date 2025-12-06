import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { getUserProfile, getFriendshipStatus, sendFriendRequest, acceptFriendRequest, removeFriend, blockUser, isUserBlocked } from '../api';
import './UserProfileModal.css';

const UserProfileModal = ({ userId, onClose }) => {
  const history = useHistory();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState('none');
  const [isBlocked, setIsBlocked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, title: '', message: '' });

  const currentUserId = localStorage.getItem('userId');
  const isOwnProfile = userId === currentUserId;
  
  // Check if we're already on messages page
  const isOnMessagesPage = location.pathname === '/messages';

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const showConfirm = (title, message, action) => {
    setConfirmModal({ show: true, title, message, action });
  };

  const handleConfirm = async () => {
    const action = confirmModal.action;
    setConfirmModal({ show: false, action: null, title: '', message: '' });
    if (action) await action();
  };

  const handleCancelConfirm = () => {
    setConfirmModal({ show: false, action: null, title: '', message: '' });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const profileData = await getUserProfile(userId);
        console.log('Profile data received:', profileData);
        setUser(profileData);
        
        if (!isOwnProfile) {
          try {
            const blockRes = await isUserBlocked(userId);
            setIsBlocked(blockRes?.isBlocked || false);
          } catch (err) {
            console.log('Block check failed:', err);
          }
          
          try {
            const friendRes = await getFriendshipStatus(userId);
            setFriendshipStatus(friendRes?.status || 'none');
          } catch (err) {
            console.log('Friendship check failed:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isOwnProfile]);

  const handleSendRequest = async () => {
    setActionLoading(true);
    try {
      await sendFriendRequest(userId);
      setFriendshipStatus('pending');
      showToast('Friend request sent!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    setActionLoading(true);
    try {
      await acceptFriendRequest(userId);
      setFriendshipStatus('friends');
      showToast('Friend request accepted!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const executeRemoveFriend = async () => {
    setActionLoading(true);
    try {
      await removeFriend(userId);
      setFriendshipStatus('none');
      showToast('Friend removed', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove friend', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = () => {
    showConfirm('Remove Friend', `Are you sure you want to remove ${user?.fullName || user?.name || 'this user'} from your friends?`, executeRemoveFriend);
  };

  const executeBlock = async () => {
    setActionLoading(true);
    try {
      await blockUser(userId);
      setIsBlocked(true);
      setFriendshipStatus('none');
      showToast('User blocked', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to block user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = () => {
    showConfirm('Block User', `Are you sure you want to block ${user?.fullName || user?.name || 'this user'}?`, executeBlock);
  };

  const handleMessage = async () => {
    // If already on messages page, just close the modal
    if (isOnMessagesPage) {
      onClose();
      return;
    }
    
    // Check if user profile is private and not friends
    if (user?.isPrivate && friendshipStatus !== 'friends') {
      showToast('This account is private. You must be friends to send messages.', 'error');
      return;
    }
    
    // Navigate to messages with userId to open chat
    onClose();
    history.push('/messages', { friendId: userId });
  };

  const handleViewProfile = () => {
    onClose();
    history.push(`/profile/${userId}`);
  };

  const canMessage = friendshipStatus === 'friends' || !user?.isPrivate;
  
  // Get display name - handle both fullName and name fields
  const displayName = user?.fullName || user?.name || 'Unknown User';
  const displayEmail = user?.email || '';

  if (loading) {
    return (
      <div className="upm-overlay" onClick={onClose}>
        <div className="upm-modal" onClick={e => e.stopPropagation()}>
          <div className="upm-loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="upm-overlay" onClick={onClose}>
        <div className="upm-modal" onClick={e => e.stopPropagation()}>
          <div className="upm-error">{error || 'User not found'}</div>
          <button className="upm-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="upm-overlay" onClick={onClose}>
      <div className="upm-modal" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button className="upm-close-x" onClick={onClose}>×</button>
        
        {/* Gradient Header */}
        <div className="upm-header-gradient"></div>
        
        {/* Avatar - overlaps gradient */}
        <div className="upm-avatar-wrapper">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={displayName} className="upm-avatar" />
          ) : (
            <div className="upm-avatar-placeholder">
              {displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          {user.isPrivate && <span className="upm-online-dot private">🔒</span>}
        </div>

        {/* User Info */}
        <div className="upm-info">
          <h2 className="upm-name">{displayName}</h2>
          {displayEmail && <p className="upm-email">{displayEmail}</p>}
          {user.bio && <p className="upm-bio">{user.bio}</p>}
        </div>

        {/* Action Buttons */}
        {!isOwnProfile && !isBlocked && (
          <div className="upm-actions">
            <div className="upm-btn-row">
              {friendshipStatus === 'friends' ? (
                <button className="upm-btn upm-btn-friends" disabled>
                  ✓ Friends
                </button>
              ) : friendshipStatus === 'pending' ? (
                <button className="upm-btn upm-btn-pending" disabled>
                  Requested
                </button>
              ) : friendshipStatus === 'requested' ? (
                <button className="upm-btn upm-btn-accept" onClick={handleAcceptRequest} disabled={actionLoading}>
                  Accept
                </button>
              ) : (
                <button className="upm-btn upm-btn-follow" onClick={handleSendRequest} disabled={actionLoading}>
                  Follow
                </button>
              )}
              
              <button 
                className={`upm-btn upm-btn-message ${!canMessage ? 'disabled' : ''}`}
                onClick={handleMessage}
                disabled={!canMessage}
              >
                Message
              </button>
            </div>
            
            <button className="upm-btn upm-btn-view-full" onClick={handleViewProfile}>
              View Profile
            </button>
            
            <div className="upm-tertiary">
              {friendshipStatus === 'friends' && (
                <button className="upm-link-btn remove" onClick={handleRemoveFriend} disabled={actionLoading}>
                  Remove Friend
                </button>
              )}
              <button className="upm-link-btn block" onClick={handleBlock} disabled={actionLoading}>
                Block User
              </button>
            </div>
          </div>
        )}

        {isOwnProfile && (
          <div className="upm-actions">
            <button className="upm-btn upm-btn-view-full" onClick={handleViewProfile}>
              View My Profile
            </button>
          </div>
        )}

        {isBlocked && (
          <div className="upm-blocked">
            <p>You have blocked this user</p>
          </div>
        )}

        {/* Toast */}
        {toast.show && (
          <div className={`upm-toast ${toast.type}`}>
            {toast.message}
          </div>
        )}

        {/* Confirm Modal */}
        {confirmModal.show && (
          <div className="upm-confirm-overlay">
            <div className="upm-confirm-box">
              <h3>{confirmModal.title}</h3>
              <p>{confirmModal.message}</p>
              <div className="upm-confirm-btns">
                <button className="upm-confirm-cancel" onClick={handleCancelConfirm}>Cancel</button>
                <button className="upm-confirm-yes" onClick={handleConfirm}>Yes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
