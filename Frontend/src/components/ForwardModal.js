import React, { useState, useEffect } from 'react';
import { getConversations } from '../api';
import './ForwardModal.css';

const ForwardModal = ({ message, onForward, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await getConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConversation = (conversationId) => {
    setSelectedConversations(prev => {
      if (prev.includes(conversationId)) {
        return prev.filter(id => id !== conversationId);
      } else {
        return [...prev, conversationId];
      }
    });
  };

  const handleForward = () => {
    if (selectedConversations.length > 0) {
      onForward(selectedConversations);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="forward-modal-overlay" onClick={onClose}>
      <div className="forward-modal" onClick={(e) => e.stopPropagation()}>
        <div className="forward-header">
          <h3>Forward</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="forward-search">
          <span className="search-label">To:</span>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="forward-section-label">Suggested</div>

        <div className="forward-conversations-list">
          {loading ? (
            <div className="loading-state">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="empty-state">No conversations found</div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv._id}
                className={`forward-conversation-item ${selectedConversations.includes(conv._id) ? 'selected' : ''}`}
                onClick={() => handleToggleConversation(conv._id)}
              >
                <div className="conv-avatar">
                  {conv.participant?.profilePicture ? (
                    <img src={`http://localhost:5000${conv.participant.profilePicture}`} alt={conv.participant.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {conv.participant?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="conv-info">
                  <span className="conv-name">{conv.participant?.name}</span>
                  <span className="conv-username">{conv.participant?.username || conv.participant?.email?.split('@')[0]}</span>
                </div>
                <div className="conv-checkbox">
                  <div className={`custom-radio ${selectedConversations.includes(conv._id) ? 'checked' : ''}`}>
                    {selectedConversations.includes(conv._id) && <span className="radio-dot"></span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="forward-actions">
          <button 
            className="send-btn" 
            onClick={handleForward}
            disabled={selectedConversations.length === 0}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
