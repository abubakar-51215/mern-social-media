import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  getAllUsers, 
  getUserDetails, 
  deleteUser, 
  toggleBlockUser, 
  toggleShadowBan, 
  warnUser 
} from '../api';
import AdminNotificationModal from '../components/AdminNotificationModal';
import './AdminUsers.css';

const AdminUsers = () => {
  const history = useHistory();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showWarnModal, setShowWarnModal] = useState(null);
  const [warnMessage, setWarnMessage] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(null);
  const [toast, setToast] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllUsers(page, 10, search);
      console.log('Users response:', response.data.users);
      setUsers(response.data.users);
      setTotal(response.data.total);
      setPages(response.data.pages);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleViewDetails = async (userId) => {
    try {
      const response = await getUserDetails(userId);
      setUserDetails(response.data);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser(userId);
      setShowDeleteConfirm(null);
      loadUsers();
      if (selectedUser === userId) {
        setSelectedUser(null);
        setUserDetails(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleBlock = async (userId, currentStatus) => {
    try {
      await toggleBlockUser(userId, !currentStatus);
      loadUsers();
      if (userDetails?.user._id === userId) {
        setUserDetails({
          ...userDetails,
          user: { ...userDetails.user, isBlocked: !currentStatus }
        });
      }
    } catch (error) {
      console.error('Error toggling block:', error);
      alert('Failed to update user status');
    }
  };

  const handleShadowBan = async (userId, currentStatus) => {
    try {
      await toggleShadowBan(userId, !currentStatus);
      loadUsers();
      if (userDetails?.user._id === userId) {
        setUserDetails({
          ...userDetails,
          user: { ...userDetails.user, isShadowBanned: !currentStatus }
        });
      }
    } catch (error) {
      console.error('Error toggling shadow ban:', error);
      alert('Failed to update user status');
    }
  };

  const handleWarn = async () => {
    if (!warnMessage.trim()) {
      alert('Please enter a warning message');
      return;
    }
    
    try {
      await warnUser(showWarnModal, warnMessage);
      setShowWarnModal(null);
      setWarnMessage('');
      alert('Warning sent successfully');
    } catch (error) {
      console.error('Error sending warning:', error);
      alert('Failed to send warning');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-users">
      {/* Header */}
      <div className="users-header">
        <button className="back-link" onClick={() => history.push('/admin/dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="users-title">
          <h1>User Management</h1>
          <p>Manage all registered users and their activities</p>
        </div>
      </div>

      <div className="users-content">
        {/* Users List */}
        <div className="users-list-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={handleSearch}
            />
          </div>

          <div className="users-stats">
            <span>Total Users: <strong>{total}</strong></span>
            <span>Page {page} of {pages}</span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Posts</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className={selectedUser === user._id ? 'selected' : ''}>
                      <td>
                        <div className="user-cell">
                          {user.profilePicture ? (
                            <img 
                              src={user.profilePicture.startsWith('/uploads') 
                                ? `http://localhost:5000${user.profilePicture}` 
                                : user.profilePicture
                              } 
                              alt={user.name} 
                              className="user-avatar" 
                            />
                          ) : (
                            <div className="user-avatar-placeholder">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{user.postCount}</td>
                      <td>
                        {user.isBlocked ? (
                          <span className="status-badge blocked">Blocked</span>
                        ) : user.isShadowBanned ? (
                          <span className="status-badge shadow-banned">Shadow Banned</span>
                        ) : (
                          <span className="status-badge active">Active</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn view"
                            onClick={() => handleViewDetails(user._id)}
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button
                            className={`action-btn ${user.isBlocked ? 'unblock' : 'block'}`}
                            onClick={() => handleBlock(user._id, user.isBlocked)}
                            title={user.isBlocked ? 'Unblock' : 'Block'}
                          >
                            {user.isBlocked ? '✅' : '🚫'}
                          </button>
                          <button
                            className="action-btn warn"
                            onClick={() => setShowWarnModal(user._id)}
                            title="Warn User"
                          >
                            ⚠️
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => setShowDeleteConfirm(user._id)}
                            title="Delete User"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>Page {page} of {pages}</span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* User Details Panel */}
        {userDetails && (
          <div className="user-details-panel">
            <div className="details-header">
              <h2>User Details</h2>
              <button onClick={() => { setSelectedUser(null); setUserDetails(null); }}>✕</button>
            </div>

            <div className="user-profile">
              {userDetails.user.profilePicture ? (
                <img src={userDetails.user.profilePicture} alt={userDetails.user.name} className="profile-pic" />
              ) : (
                <div className="profile-pic-placeholder">
                  {userDetails.user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h3>{userDetails.user.name}</h3>
              <p>{userDetails.user.email}</p>
            </div>

            <div className="user-info">
              <div className="info-row">
                <span className="info-label">User ID:</span>
                <span className="info-value">{userDetails.user._id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Joined:</span>
                <span className="info-value">{formatDate(userDetails.user.createdAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Login:</span>
                <span className="info-value">
                  {userDetails.user.lastLogin ? formatDate(userDetails.user.lastLogin) : 'Never'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Posts:</span>
                <span className="info-value">{userDetails.user.postCount}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Followers:</span>
                <span className="info-value">{userDetails.user.followersCount}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Following:</span>
                <span className="info-value">{userDetails.user.followingCount}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Friends:</span>
                <span className="info-value">{userDetails.user.friendsCount}</span>
              </div>
            </div>

            <div className="user-activity">
              <h4>Activity Summary</h4>
              <div className="activity-stats">
                <div className="activity-stat">
                  <span className="stat-icon">❤️</span>
                  <div>
                    <p className="stat-value">{userDetails.activity.totalLikes}</p>
                    <p className="stat-label">Total Likes</p>
                  </div>
                </div>
                <div className="activity-stat">
                  <span className="stat-icon">💬</span>
                  <div>
                    <p className="stat-value">{userDetails.activity.totalComments}</p>
                    <p className="stat-label">Comments Made</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="recent-posts">
              <h4>Recent Posts</h4>
              {userDetails.activity.recentPosts.map((post) => (
                <div key={post._id} className="post-item">
                  <p className="post-content">{post.content}</p>
                  <span className="post-date">{formatDate(post.createdAt)}</span>
                </div>
              ))}
            </div>

            <div className="admin-actions">
              <button
                className={`admin-action-btn ${userDetails.user.isBlocked ? 'success' : 'danger'}`}
                onClick={() => handleBlock(userDetails.user._id, userDetails.user.isBlocked)}
              >
                {userDetails.user.isBlocked ? '✅ Unblock User' : '🚫 Block User'}
              </button>
              <button
                className={`admin-action-btn ${userDetails.user.isShadowBanned ? 'info' : 'warning'}`}
                onClick={() => handleShadowBan(userDetails.user._id, userDetails.user.isShadowBanned)}
              >
                {userDetails.user.isShadowBanned ? '👁️ Remove Shadow Ban' : '👻 Shadow Ban'}
              </button>
              <button
                className="admin-action-btn warning"
                onClick={() => setShowWarnModal(userDetails.user._id)}
              >
                ⚠️ Warn User
              </button>
              <button
                className="admin-action-btn info"
                onClick={() => setShowNotificationModal(userDetails.user)}
              >
                📢 Send Notification
              </button>
              <button
                className="admin-action-btn danger"
                onClick={() => setShowDeleteConfirm(userDetails.user._id)}
              >
                🗑️ Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete User Account?</h3>
            <p>This action cannot be undone. All user data including posts and messages will be permanently deleted.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="delete-btn" onClick={() => handleDelete(showDeleteConfirm)}>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warn User Modal */}
      {showWarnModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Send Warning</h3>
            <textarea
              placeholder="Enter warning message..."
              value={warnMessage}
              onChange={(e) => setWarnMessage(e.target.value)}
              rows="4"
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setShowWarnModal(null); setWarnMessage(''); }}>
                Cancel
              </button>
              <button className="warn-btn" onClick={handleWarn}>
                Send Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Notification Modal */}
      {showNotificationModal && (
        <AdminNotificationModal
          userId={showNotificationModal._id}
          userName={showNotificationModal.name}
          onClose={() => setShowNotificationModal(null)}
          onSuccess={(message) => {
            showToast(message);
            loadUsers();
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast-notification">
          ✓ {toast}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
