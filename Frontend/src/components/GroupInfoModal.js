import React, { useState, useEffect } from 'react';
import { toast } from './Toast';
import { 
  updateGroup, 
  updateGroupAvatar, 
  updateGroupSettings, 
  addGroupMembers, 
  removeGroupMember, 
  leaveGroup, 
  makeGroupAdmin, 
  removeGroupAdmin,
  deleteGroup 
} from '../api';
import './GroupInfoModal.css';

const GroupInfoModal = ({ isOpen, onClose, group, friends, currentUser, onGroupUpdated, onGroupLeft, onGroupDeleted }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [settings, setSettings] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = group?.members?.find(m => 
    (m.user._id || m.user) === currentUser._id && m.role === 'admin'
  );
  const isCreator = group?.createdBy?._id === currentUser._id;

  useEffect(() => {
    if (group) {
      setGroupName(group.name || '');
      setDescription(group.description || '');
      setSettings(group.settings || {});
    }
  }, [group]);

  const handleUpdateInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await updateGroup(group._id, { name: groupName, description });
      onGroupUpdated(response.data);
      setSuccess('Group info updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const response = await updateGroupAvatar(group._id, file);
      onGroupUpdated(response.data);
      setSuccess('Avatar updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      const response = await updateGroupSettings(group._id, newSettings);
      onGroupUpdated(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
      setSettings(settings); // Revert on error
    }
  };

  const handleAddMember = async (friendId) => {
    try {
      const response = await addGroupMembers(group._id, [friendId]);
      onGroupUpdated(response.data);
      setSearchQuery('');
      setSuccess('Member added!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    toast.confirm('Remove this member from the group?', {
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await removeGroupMember(group._id, memberId);
          onGroupUpdated(response.data);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to remove member');
        }
      }
    });
  };

  const handleMakeAdmin = async (memberId) => {
    try {
      const response = await makeGroupAdmin(group._id, memberId);
      onGroupUpdated(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to promote member');
    }
  };

  const handleRemoveAdmin = async (memberId) => {
    try {
      const response = await removeGroupAdmin(group._id, memberId);
      onGroupUpdated(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to demote admin');
    }
  };

  const handleLeaveGroup = async () => {
    toast.confirm('Are you sure you want to leave this group?', {
      confirmText: 'Leave',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await leaveGroup(group._id);
          onGroupLeft(group._id);
          onClose();
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to leave group');
        }
      }
    });
  };

  const handleDeleteGroup = async () => {
    toast.confirm('Are you sure you want to delete this group? This action cannot be undone.', {
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteGroup(group._id);
          onGroupDeleted(group._id);
          onClose();
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to delete group');
        }
      }
    });
  };

  const availableFriends = friends.filter(friend => 
    !group?.members?.find(m => (m.user._id || m.user) === friend._id) &&
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen || !group) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="group-info-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Group Info</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={activeTab === 'info' ? 'active' : ''} 
            onClick={() => setActiveTab('info')}
          >
            Info
          </button>
          <button 
            className={activeTab === 'members' ? 'active' : ''} 
            onClick={() => setActiveTab('members')}
          >
            Members ({group.members?.length || 0})
          </button>
          {isAdmin && (
            <button 
              className={activeTab === 'settings' ? 'active' : ''} 
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="modal-content">
          {activeTab === 'info' && (
            <div className="info-tab">
              <div className="group-avatar-section">
                <div className="group-avatar-large">
                  {group.avatar ? (
                    <img src={`http://localhost:5000${group.avatar}`} alt={group.name} />
                  ) : (
                    <span>{group.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {(isAdmin || !group.settings?.onlyAdminsCanEditInfo) && (
                  <label className="change-avatar-btn">
                    📷 Change Photo
                    <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                  </label>
                )}
              </div>

              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={!isAdmin && group.settings?.onlyAdminsCanEditInfo}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  disabled={!isAdmin && group.settings?.onlyAdminsCanEditInfo}
                />
              </div>

              {(isAdmin || !group.settings?.onlyAdminsCanEditInfo) && (
                <button 
                  className="save-btn" 
                  onClick={handleUpdateInfo}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              )}

              <div className="group-meta">
                <p>Created by <strong>{group.createdBy?.name}</strong></p>
                <p>Created on {new Date(group.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="members-tab">
              {(isAdmin || !group.settings?.onlyAdminsCanAddMembers) && (
                <div className="add-member-section">
                  <input
                    type="text"
                    placeholder="Search friends to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && availableFriends.length > 0 && (
                    <div className="friend-suggestions">
                      {availableFriends.slice(0, 5).map(friend => (
                        <div
                          key={friend._id}
                          className="friend-suggestion-item"
                          onClick={() => handleAddMember(friend._id)}
                        >
                          <div className="member-avatar">
                            {friend.profilePicture ? (
                              <img src={friend.profilePicture} alt={friend.name} />
                            ) : (
                              friend.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span>{friend.name}</span>
                          <span className="add-icon">+</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="members-list">
                {group.members?.map(member => {
                  const memberUser = member.user;
                  const memberId = memberUser._id || memberUser;
                  const isMemberAdmin = member.role === 'admin';
                  const isMemberCreator = group.createdBy?._id === memberId;
                  const isCurrentMember = memberId === currentUser._id;

                  return (
                    <div key={memberId} className="member-item">
                      <div className="member-avatar">
                        {memberUser.profilePicture ? (
                          <img src={memberUser.profilePicture} alt={memberUser.name} />
                        ) : (
                          memberUser.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="member-info">
                        <span className="member-name">
                          {memberUser.name} {isCurrentMember && '(You)'}
                        </span>
                        {isMemberCreator && <span className="role-badge creator">Creator</span>}
                        {isMemberAdmin && !isMemberCreator && <span className="role-badge admin">Admin</span>}
                      </div>
                      {isAdmin && !isCurrentMember && !isMemberCreator && (
                        <div className="member-actions">
                          {isMemberAdmin ? (
                            isCreator && (
                              <button 
                                className="action-btn demote"
                                onClick={() => handleRemoveAdmin(memberId)}
                                title="Remove Admin"
                              >
                                ⬇️
                              </button>
                            )
                          ) : (
                            <button 
                              className="action-btn promote"
                              onClick={() => handleMakeAdmin(memberId)}
                              title="Make Admin"
                            >
                              ⬆️
                            </button>
                          )}
                          <button 
                            className="action-btn remove"
                            onClick={() => handleRemoveMember(memberId)}
                            title="Remove Member"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'settings' && isAdmin && (
            <div className="settings-tab">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Only admins can send messages</span>
                  <span className="setting-desc">Members won't be able to send messages</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.onlyAdminsCanSend || false}
                    onChange={(e) => handleSettingsChange('onlyAdminsCanSend', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Only admins can edit group info</span>
                  <span className="setting-desc">Name, description, and avatar</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.onlyAdminsCanEditInfo !== false}
                    onChange={(e) => handleSettingsChange('onlyAdminsCanEditInfo', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Only admins can add members</span>
                  <span className="setting-desc">Members won't be able to add new people</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.onlyAdminsCanAddMembers || false}
                    onChange={(e) => handleSettingsChange('onlyAdminsCanAddMembers', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="leave-btn" onClick={handleLeaveGroup}>
            🚪 Leave Group
          </button>
          {isCreator && (
            <button className="delete-btn" onClick={handleDeleteGroup}>
              🗑️ Delete Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
