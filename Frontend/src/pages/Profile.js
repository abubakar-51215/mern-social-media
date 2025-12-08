import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getUserProfile, getUserPosts, getLikedPosts, sendFriendRequest, removeFriend, getFriendshipStatus, getSavedPosts } from '../api';
import { getUser } from '../utils/auth';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import QRCodeModal from '../components/QRCodeModal';
import './Profile.css';

const Profile = () => {
  const { userId } = useParams();
  const history = useHistory();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationError, setVerificationError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const currentUser = getUser();
  const isOwnProfile = !userId || userId === currentUser?._id;
  const [activeTab, setActiveTab] = useState('posts');
  const [friendshipStatus, setFriendshipStatus] = useState(null); // 'none', 'pending', 'friends', 'requested'
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedMediaPost, setSelectedMediaPost] = useState(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Reload profile when navigating back from edit or when tab becomes visible
  useEffect(() => {
    const handleFocus = () => {
      loadProfile();
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProfile();
      }
    };
    
    // Listen for when user navigates back to this page
    const handlePopState = () => {
      loadProfile();
    };
    
    // Listen for localStorage changes (when profile is updated in EditProfile)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.storageArea === localStorage) {
        loadProfile();
      }
    };
    
    // Listen for custom profile update event (immediate update without full reload)
    const handleProfileUpdate = (e) => {
      if (e.detail?.profilePicture) {
        // Immediate update for profile picture
        setProfile(prev => prev ? { ...prev, profilePicture: e.detail.profilePicture } : prev);
      }
      // Also do a full reload to ensure everything is in sync
      loadProfile();
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const targetId = userId || currentUser?._id;
      if (!targetId) {
        setLoading(false);
        return;
      }
      const profileData = await getUserProfile(targetId);
      setProfile(profileData);
      
      // Load user's posts
      const userPosts = await getUserPosts(targetId);
      setPosts(userPosts);
      
      // Load liked posts and saved posts (only for own profile)
      if (isOwnProfile) {
        try {
          const liked = await getLikedPosts();
          setLikedPosts(liked);
        } catch (err) {
          console.error('Error loading liked posts:', err);
        }
        
        try {
          const saved = await getSavedPosts();
          setSavedPosts(saved);
        } catch (err) {
          console.error('Error loading saved posts:', err);
        }
      }

      // Check friendship status for other users' profiles
      if (!isOwnProfile && currentUser) {
        try {
          const statusResponse = await getFriendshipStatus(targetId);
          // statusResponse is already { status: 'xxx' } from api.js
          setFriendshipStatus(statusResponse.status || 'none');
        } catch (err) {
          // Fallback: check from profile data
          const isFriend = profileData.friends?.some(f => 
            f === currentUser._id || f._id === currentUser._id
          );
          const hasPendingRequest = profileData.friendRequests?.some(f => 
            f === currentUser._id || f._id === currentUser._id
          );
          
          if (isFriend) {
            setFriendshipStatus('friends');
          } else if (hasPendingRequest) {
            setFriendshipStatus('pending');
          } else {
            setFriendshipStatus('none');
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Efficient update handler - updates post locally without reloading
  const handlePostUpdate = (updatedPost) => {
    if (updatedPost) {
      const currentUserId = currentUser?._id;
      
      // Update in posts array
      setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
      
      // Update liked posts - add if user liked it, remove if user unliked it
      setLikedPosts(prev => {
        const isLiked = updatedPost.likes?.some(like => 
          (typeof like === 'string' ? like : like._id) === currentUserId
        );
        
        if (isLiked) {
          // Add to liked posts if not already there
          const exists = prev.some(p => p._id === updatedPost._id);
          if (!exists) {
            return [updatedPost, ...prev];
          }
          // Update if already exists
          return prev.map(p => p._id === updatedPost._id ? updatedPost : p);
        } else {
          // Remove from liked posts if user unliked
          return prev.filter(p => p._id !== updatedPost._id);
        }
      });
      
      // Update in saved posts
      setSavedPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    }
  };

  // Reload posts only (not entire profile) - for delete operations
  const reloadPosts = async () => {
    const targetId = userId || currentUser?._id;
    if (!targetId) return;
    
    const userPosts = await getUserPosts(targetId);
    setPosts(userPosts);
    
    if (isOwnProfile) {
      try {
        const liked = await getLikedPosts();
        setLikedPosts(liked);
      } catch (err) {
        console.error('Error reloading liked posts:', err);
      }
      
      try {
        const saved = await getSavedPosts();
        setSavedPosts(saved);
      } catch (err) {
        console.error('Error reloading saved posts:', err);
      }
    }
  };

  const handleFollowAction = async () => {
    if (!currentUser || actionLoading) return;
    
    setActionLoading(true);
    try {
      if (friendshipStatus === 'friends') {
        await removeFriend(userId);
        setFriendshipStatus('none');
      } else if (friendshipStatus === 'none') {
        await sendFriendRequest(userId);
        setFriendshipStatus('pending');
      }
    } catch (error) {
      console.error('Error with follow action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = () => {
    history.push(`/messages?user=${userId}`);
  };

  // eslint-disable-next-line no-unused-vars
  const handleVerifyEmail = () => {
    setShowVerificationModal(true);
    setResendTimer(20);
    // TODO: Call API to send verification code
    // await API.post('/auth/send-verification-code');
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`code-input-${index + 1}`)?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setVerificationError('Please enter the 6-digit code');
      return;
    }

    try {
      // TODO: Call API to verify code
      // await API.post('/auth/verify-email', { code });
      setVerificationError('Incorrect code'); // Placeholder until API is connected
      // On success:
      // setShowVerificationModal(false);
      // loadProfile();
    } catch (error) {
      setVerificationError('Incorrect code');
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    try {
      // TODO: Call API to resend verification code
      // await API.post('/auth/send-verification-code');
      setResendTimer(20);
      setVerificationError('');
      setVerificationCode(['', '', '', '', '', '']);
    } catch (error) {
      console.error('Error resending code:', error);
    }
  };

  const handleCloseModal = () => {
    setShowVerificationModal(false);
    setVerificationCode(['', '', '', '', '', '']);
    setVerificationError('');
    setResendTimer(0);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Sidebar />
        <div className="profile-content">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <Sidebar />
        <div className="profile-content">
          <div className="error-message">Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-content">
        <div className="profile-card">
          <div 
            className="profile-cover-gradient"
            style={{
              backgroundImage: profile.coverPhoto 
                ? `url(${profile.coverPhoto})` 
                : 'linear-gradient(135deg, #fed2f7 0%, #b1c2ff 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
        
          <div className="profile-main">
            <div className="profile-avatar-large">
            {profile.profilePicture ? (
              <img src={profile.profilePicture.startsWith('/uploads') ? `http://localhost:5000${profile.profilePicture}` : profile.profilePicture} alt={profile.name} />
            ) : (
              <div className="avatar-placeholder-large">
                {profile.name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <>
                <button 
                  className="btn-edit-profile"
                  onClick={() => history.push('/edit-profile')}
                >
                  Edit Profile
                </button>
                <button 
                  className="btn-qr-code"
                  onClick={() => setShowQRModal(true)}
                  title="Show QR Code"
                >
                  📱
                </button>
              </>
            ) : (
              <>
                <button 
                  className={`btn-follow ${friendshipStatus === 'friends' ? 'following' : ''}`}
                  onClick={handleFollowAction}
                  disabled={actionLoading || friendshipStatus === 'pending'}
                >
                  {actionLoading ? '...' : 
                   friendshipStatus === 'friends' ? 'Following' :
                   friendshipStatus === 'pending' ? 'Requested' :
                   'Follow'}
                </button>
                <button 
                  className="btn-message"
                  onClick={handleMessage}
                >
                  Message
                </button>
              </>
            )}
          </div>

          <div className="profile-info-section">
            <h1 className="profile-name">
              {profile.name}
              {profile.isPrivate && <span className="private-badge">🔒 Private</span>}
            </h1>
            <p className="profile-username">@{profile.email?.split('@')[0]}</p>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            
            <div className="profile-meta">
              <span className="meta-item">
                <span className="meta-icon">📍</span>
                {profile.location || 'Location not set'}
              </span>
              <span className="meta-item">
                <span className="meta-icon">🔗</span>
                {profile.website || 'No website'}
              </span>
              <span className="meta-item">
                <span className="meta-icon">📅</span>
                Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="profile-stats-row">
              <div className="stat-box">
                <span className="stat-number">{posts.length}</span>
                <span className="stat-text">Posts</span>
              </div>
              {/* Show followers/following only if: own profile, public account, or friends with private account */}
              {(isOwnProfile || !profile.isPrivate || friendshipStatus === 'friends') ? (
                <>
                  <div 
                    className="stat-box clickable" 
                    onClick={() => {
                      setFollowersList(profile.followers || []);
                      setShowFollowersModal(true);
                    }}
                  >
                    <span className="stat-number">{profile.followers?.length || 0}</span>
                    <span className="stat-text">Followers</span>
                  </div>
                  <div 
                    className="stat-box clickable"
                    onClick={() => {
                      setFollowingList(profile.following || []);
                      setShowFollowingModal(true);
                    }}
                  >
                    <span className="stat-number">{profile.following?.length || 0}</span>
                    <span className="stat-text">Following</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="stat-box">
                    <span className="stat-number">🔒</span>
                    <span className="stat-text">Followers</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-number">🔒</span>
                    <span className="stat-text">Following</span>
                  </div>
                </>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="profile-tabs-container">
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button 
            className={`tab-btn ${activeTab === 'likes' ? 'active' : ''}`}
            onClick={() => setActiveTab('likes')}
          >
            Likes
          </button>
          {isOwnProfile && (
            <button 
              className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved
            </button>
          )}
        </div>
      </div>

      <div className="profile-content-area">
        {activeTab === 'posts' && (
          <div className="posts-tab">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  currentUser={currentUser}
                  onUpdate={handlePostUpdate}
                  onDelete={reloadPosts}
                />
              ))
            ) : (
              <div className="empty-posts">
                <span className="empty-icon">{profile.isPrivate && !isOwnProfile && friendshipStatus !== 'friends' ? '🔒' : '📝'}</span>
                <p>
                  {profile.isPrivate && !isOwnProfile && friendshipStatus !== 'friends' 
                    ? 'This account is private. Follow to see their posts.' 
                    : 'No posts yet'}
                </p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'likes' && (
          <div className="likes-tab">
            {likedPosts.length > 0 ? (
              likedPosts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  currentUser={currentUser}
                  onUpdate={handlePostUpdate}
                  onDelete={reloadPosts}
                />
              ))
            ) : (
              <div className="empty-posts">
                <span className="empty-icon">❤️</span>
                <p>No liked posts yet</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'saved' && isOwnProfile && (
          <div className="saved-tab">
            {savedPosts.length > 0 ? (
              savedPosts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  currentUser={currentUser}
                  onUpdate={handlePostUpdate}
                  onDelete={reloadPosts}
                />
              ))
            ) : (
              <div className="empty-posts">
                <span className="empty-icon">🔖</span>
                <p>No saved posts yet</p>
                <p className="empty-subtitle">Posts you save will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Email Verification Modal */}
      {showVerificationModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="verification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Verify your email</h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                We've sent a 6-digit verification code to <strong>{profile?.email}</strong>
              </p>
              <div className="code-inputs">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-input-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    className={`code-input ${verificationError ? 'error' : ''}`}
                  />
                ))}
              </div>
              {verificationError && (
                <div className="verification-error">{verificationError}</div>
              )}
              <div className="modal-actions">
                <button 
                  className={`resend-link ${resendTimer > 0 ? 'disabled' : ''}`}
                  onClick={handleResendCode}
                  disabled={resendTimer > 0}
                >
                  Resend {resendTimer > 0 && `(${resendTimer})`}
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="verify-btn-modal" onClick={handleVerifyCode}>
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Post Modal */}
      {selectedMediaPost && (
        <div className="modal-overlay" onClick={() => setSelectedMediaPost(null)}>
          <div className="media-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedMediaPost(null)}>×</button>
            <div className="media-modal-content">
              <div className="media-modal-images">
                {selectedMediaPost.images.map((img, idx) => (
                  <img 
                    key={idx}
                    src={img.startsWith('/uploads') ? `http://localhost:5000${img}` : img} 
                    alt={`Post ${idx + 1}`} 
                  />
                ))}
              </div>
              <div className="media-modal-details">
                <div className="media-modal-author">
                  <div className="author-avatar">
                    {selectedMediaPost.author?.profilePicture ? (
                      <img src={selectedMediaPost.author.profilePicture.startsWith('/uploads') ? `http://localhost:5000${selectedMediaPost.author.profilePicture}` : selectedMediaPost.author.profilePicture} alt="" />
                    ) : (
                      <span>{selectedMediaPost.author?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="author-info">
                    <span className="author-name">{selectedMediaPost.author?.name}</span>
                    <span className="post-date">{new Date(selectedMediaPost.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="media-modal-content-text">{selectedMediaPost.content}</p>
                <div className="media-modal-stats">
                  <span>❤️ {selectedMediaPost.likes?.length || 0} likes</span>
                  <span>💬 {selectedMediaPost.comments?.length || 0} comments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="follow-modal-overlay" onClick={() => setShowFollowersModal(false)}>
          <div className="follow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="follow-modal-header">
              <h3>Followers</h3>
              <button className="close-modal" onClick={() => setShowFollowersModal(false)}>×</button>
            </div>
            <div className="follow-modal-content">
              {followersList.length === 0 ? (
                <p className="no-followers">No followers yet</p>
              ) : (
                followersList.map((follower) => (
                  <div key={follower._id || follower} className="follow-user-item">
                    <div 
                      className="follow-user-info"
                      onClick={() => {
                        setShowFollowersModal(false);
                        history.push(`/profile/${follower._id || follower}`);
                      }}
                    >
                      <div className="follow-user-avatar">
                        {follower.profilePicture ? (
                          <img 
                            src={follower.profilePicture.startsWith('/uploads') ? `http://localhost:5000${follower.profilePicture}` : follower.profilePicture} 
                            alt={follower.name} 
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {follower.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="follow-user-details">
                        <span className="follow-user-name">{follower.name || 'User'}</span>
                        <span className="follow-user-username">@{follower.email?.split('@')[0] || follower.username}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="follow-modal-overlay" onClick={() => setShowFollowingModal(false)}>
          <div className="follow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="follow-modal-header">
              <h3>Following</h3>
              <button className="close-modal" onClick={() => setShowFollowingModal(false)}>×</button>
            </div>
            <div className="follow-modal-content">
              {followingList.length === 0 ? (
                <p className="no-followers">Not following anyone yet</p>
              ) : (
                followingList.map((following) => (
                  <div key={following._id || following} className="follow-user-item">
                    <div 
                      className="follow-user-info"
                      onClick={() => {
                        setShowFollowingModal(false);
                        history.push(`/profile/${following._id || following}`);
                      }}
                    >
                      <div className="follow-user-avatar">
                        {following.profilePicture ? (
                          <img 
                            src={following.profilePicture.startsWith('/uploads') ? `http://localhost:5000${following.profilePicture}` : following.profilePicture} 
                            alt={following.name} 
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {following.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="follow-user-details">
                        <span className="follow-user-name">{following.name || 'User'}</span>
                        <span className="follow-user-username">@{following.email?.split('@')[0] || following.username}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <QRCodeModal 
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        user={profile || currentUser}
      />
    </div>
  );
};

export default Profile;
