import React, { useState, useEffect } from 'react';
import { createGroup } from '../api';
import './CreateGroupModal.css';

const CreateGroupModal = ({ isOpen, onClose, friends, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      setError('');
    }
  }, [isOpen]);

  // Get available friends (not already selected)
  const availableFriends = (friends || []).filter(friend =>
    !selectedMembers.find(m => m._id === friend._id)
  );

  const handleSelectMember = (friend) => {
    setSelectedMembers([...selectedMembers, friend]);
  };

  const handleRemoveMember = (memberId) => {
    setSelectedMembers(selectedMembers.filter(m => m._id !== memberId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedMembers.length < 1) {
      setError('Please select at least one member');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const memberIds = selectedMembers.map(m => m._id);
      const response = await createGroup(groupName.trim(), description.trim(), memberIds);
      onGroupCreated(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-group-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Group Name *</label>
            <input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              placeholder="What's this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Add Members *</label>
            <div className="friends-list-container">
              {availableFriends.length === 0 ? (
                <div className="no-friends-message">
                  {(friends || []).length === 0 
                    ? 'No friends yet. Add friends first!' 
                    : 'All friends have been added'}
                </div>
              ) : (
                <div className="friends-list">
                  {availableFriends.map(friend => (
                    <div
                      key={friend._id}
                      className="friend-item"
                      onClick={() => handleSelectMember(friend)}
                    >
                      <div className="friend-avatar">
                        {friend.profilePicture ? (
                          <img src={`http://localhost:5000${friend.profilePicture}`} alt={friend.name} />
                        ) : (
                          friend.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="friend-name">{friend.name}</span>
                      <span className="add-icon">+</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedMembers.length > 0 && (
            <div className="selected-members">
              <label>Selected Members ({selectedMembers.length})</label>
              <div className="members-chips">
                {selectedMembers.map(member => (
                  <div key={member._id} className="member-chip">
                    <div className="chip-avatar">
                      {member.profilePicture ? (
                        <img src={`http://localhost:5000${member.profilePicture}`} alt={member.name} />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span>{member.name}</span>
                    <button
                      type="button"
                      className="remove-chip"
                      onClick={() => handleRemoveMember(member._id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
