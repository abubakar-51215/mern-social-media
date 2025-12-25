import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { getSocket } from '../socket';
import { toast } from '../components/Toast';
import { 
  getFriendRequests, 
  getFriends, 
  getPendingRequests,
  acceptFriendRequest, 
  rejectFriendRequest,
  sendFriendRequest,
  getSuggestedUsers,
  removeFriend
} from '../api';
import './Connections.css';

const Connections = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const socketRef = useRef(null);
  const history = useHistory();

  // Load all data on initial mount
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload current tab data when tab changes
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Initialize Socket.io connection
    socketRef.current = getSocket();
    if (user?._id) {
      socketRef.current.emit('join', user._id);
    }

    // Listen for friend request events
    const handleFriendRequestReceived = (data) => {
      showMessage(`New friend request from ${data.from?.name || 'Someone'}!`);
      // Reload all data to update counts
      loadAllData();
    };
    socketRef.current.on('friendRequestReceived', handleFriendRequestReceived);

    const handleFriendRequestAccepted = (data) => {
      showMessage(`${data.from?.name || 'Someone'} accepted your friend request!`);
      // Reload all data to update counts
      loadAllData();
    };
    socketRef.current.on('friendRequestAccepted', handleFriendRequestAccepted);

    const handleFriendRequestRejected = () => {
      showMessage(`Your friend request was declined`, true);
      // Reload all data to update counts
      loadAllData();
    };
    socketRef.current.on('friendRequestRejected', handleFriendRequestRejected);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('friendRequestReceived', handleFriendRequestReceived);
        socketRef.current.off('friendRequestAccepted', handleFriendRequestAccepted);
        socketRef.current.off('friendRequestRejected', handleFriendRequestRejected);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (message, isError = false) => {
    if (isError) {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 3000);
    } else {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Load all data for counts on initial mount
  const loadAllData = async () => {
    try {
      const [friendsData, requestsData, pendingData, suggestionsData] = await Promise.all([
        getFriends(),
        getFriendRequests(),
        getPendingRequests(),
        getSuggestedUsers()
      ]);
      setFriends(friendsData || []);
      setFriendRequests(requestsData || []);
      setPendingRequests(pendingData || []);
      setSuggestions(suggestionsData || []);
    } catch (error) {
      console.error('Error loading all data:', error);
    }
  };

  // Load data for current tab
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'friends') {
        const data = await getFriends();
        setFriends(data || []);
      } else if (activeTab === 'requests') {
        const data = await getFriendRequests();
        setFriendRequests(data || []);
      } else if (activeTab === 'pending') {
        const data = await getPendingRequests();
        setPendingRequests(data || []);
      } else if (activeTab === 'suggestions') {
        const data = await getSuggestedUsers();
        setSuggestions(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await acceptFriendRequest(userId);
      showMessage('Friend request accepted! Added to friends.');
      
      // Emit Socket.io event to notify the sender
      if (socketRef.current) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        socketRef.current.emit('friendRequestAccepted', {
          senderId: userId,
          accepterName: user.name
        });
      }
      
      // Remove from requests and reload all data to update counts
      setFriendRequests(prev => prev.filter(req => req._id !== userId));
      loadAllData();
    } catch (error) {
      console.error('Error accepting request:', error);
      showMessage('Failed to accept request', true);
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await rejectFriendRequest(userId);
      showMessage('Friend request rejected');
      
      // Emit Socket.io event to notify the sender
      if (socketRef.current) {
        socketRef.current.emit('friendRequestRejected', {
          senderId: userId
        });
      }
      
      // Remove from requests list and reload all data
      setFriendRequests(prev => prev.filter(req => req._id !== userId));
      loadAllData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      showMessage('Failed to reject request', true);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      showMessage('Friend request sent! Check Pending tab.');
      
      // Emit Socket.io event to notify the receiver
      if (socketRef.current) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        socketRef.current.emit('sendFriendRequest', {
          receiverId: userId,
          senderName: user.name
        });
      }
      
      // Remove from suggestions and reload all data to update pending count
      setSuggestions(prev => prev.filter(s => s._id !== userId));
      loadAllData();
    } catch (error) {
      console.error('Error sending request:', error);
      showMessage(error.response?.data?.message || 'Failed to send request', true);
    }
  };

  const handleRemoveFriend = async (userId) => {
    toast.confirm('Are you sure you want to remove this friend?', {
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await removeFriend(userId);
          showMessage('Friend removed');
          loadAllData();
        } catch (error) {
          console.error('Error removing friend:', error);
          showMessage('Failed to remove friend', true);
        }
      }
    });
  };

  const handleMessage = (friendId) => {
    history.push('/messages', { friendId });
  };

  return (
    <div className="connections-page">
      {successMessage && (
        <div className="message-banner success">
          <span>✓</span> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="message-banner error">
          <span>✕</span> {errorMessage}
        </div>
      )}

      <div className="connections-header">
        <h1>Connections</h1>
        <p>Manage your friends and connections</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friends.length})
        </button>
        <button 
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({friendRequests.length})
        </button>
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingRequests.length})
        </button>
        <button 
          className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
        </button>
      </div>

      <div className="connections-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'friends' && (
              <div className="connections-grid">
                {friends.length === 0 ? (
                  <div className="empty-state">
                    <p>No friends yet. Start by sending friend requests!</p>
                    <button onClick={() => setActiveTab('suggestions')}>Find People</button>
                  </div>
                ) : (
                  friends.map(friend => (
                    <div key={friend._id} className="connection-card">
                      <div className="user-avatar">
                        {friend.profilePicture ? (
                          <img src={friend.profilePicture.startsWith('http') ? friend.profilePicture : `http://localhost:5000${friend.profilePicture}`} alt={friend.name} />
                        ) : (
                          friend.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <h3>{friend.name}</h3>
                      <p>@{friend.email?.split('@')[0]}</p>
                      <div className="card-actions">
                        <button className="btn-primary" onClick={() => handleMessage(friend._id)}>
                          Message
                        </button>
                        <button className="btn-secondary" onClick={() => history.push(`/profile/${friend._id}`)}>
                          Profile
                        </button>
                        <button className="btn-danger" onClick={() => handleRemoveFriend(friend._id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="connections-grid">
                {friendRequests.length === 0 ? (
                  <div className="empty-state">
                    <p>No pending friend requests</p>
                  </div>
                ) : (
                  friendRequests.map(request => (
                    <div key={request._id} className="connection-card">
                      <div className="user-avatar">
                        {request.profilePicture ? (
                          <img src={request.profilePicture.startsWith('http') ? request.profilePicture : `http://localhost:5000${request.profilePicture}`} alt={request.name} />
                        ) : (
                          request.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <h3>{request.name}</h3>
                      <p>@{request.email?.split('@')[0]}</p>
                      <div className="card-actions">
                        <button className="btn-success" onClick={() => handleAcceptRequest(request._id)}>
                          Accept
                        </button>
                        <button className="btn-danger" onClick={() => handleRejectRequest(request._id)}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'pending' && (
              <div className="connections-grid">
                {pendingRequests.length === 0 ? (
                  <div className="empty-state">
                    <p>No pending sent requests</p>
                  </div>
                ) : (
                  pendingRequests.map(request => (
                    <div key={request._id} className="connection-card">
                      <div className="user-avatar">
                        {request.profilePicture ? (
                          <img src={request.profilePicture.startsWith('http') ? request.profilePicture : `http://localhost:5000${request.profilePicture}`} alt={request.name} />
                        ) : (
                          request.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <h3>{request.name}</h3>
                      <p>@{request.email?.split('@')[0]}</p>
                      <div className="card-actions">
                        <span className="pending-badge">Pending</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'suggestions' && (
              <div className="connections-grid">
                {suggestions.length === 0 ? (
                  <div className="empty-state">
                    <p>No suggestions available at the moment</p>
                  </div>
                ) : (
                  suggestions.map(user => (
                    <div key={user._id} className="connection-card">
                      <div className="user-avatar">
                        {user.profilePicture ? (
                          <img src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`} alt={user.name} />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <h3>{user.name}</h3>
                      <p>@{user.email?.split('@')[0]}</p>
                      <div className="card-actions">
                        <button className="btn-primary" onClick={() => handleSendRequest(user._id)}>
                          Add Friend
                        </button>
                        <button className="btn-secondary" onClick={() => history.push(`/profile/${user._id}`)}>
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Connections;
