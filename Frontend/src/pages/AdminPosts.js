import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  getAdminPosts, 
  getPostAnalytics, 
  deleteAdminPost, 
  markPostInappropriate, 
  togglePostComments 
} from '../api';
import './AdminPosts.css';

const AdminPosts = () => {
  const history = useHistory();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postAnalytics, setPostAnalytics] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    userId: '',
    hashtag: '',
    startDate: '',
    endDate: '',
    reported: false
  });

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminPosts(page, 10, filters);
      setPosts(response.data.posts);
      setTotal(response.data.total);
      setPages(response.data.pages);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleViewAnalytics = async (postId) => {
    try {
      const response = await getPostAnalytics(postId);
      setPostAnalytics(response.data);
      setSelectedPost(postId);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await deleteAdminPost(postId);
      setPosts(posts.filter(p => p._id !== postId));
      setShowDeleteConfirm(null);
      setSelectedPost(null);
      setPostAnalytics(null);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleMarkInappropriate = async (postId, inappropriate) => {
    try {
      await markPostInappropriate(postId, inappropriate);
      setPosts(posts.map(p => 
        p._id === postId ? { ...p, isInappropriate: inappropriate } : p
      ));
      if (postAnalytics && postAnalytics.postId === postId) {
        setPostAnalytics({ ...postAnalytics, isInappropriate: inappropriate });
      }
    } catch (error) {
      console.error('Error marking post:', error);
    }
  };

  const handleToggleComments = async (postId) => {
    try {
      const response = await togglePostComments(postId);
      setPosts(posts.map(p => 
        p._id === postId ? { ...p, commentsDisabled: response.data.post.commentsDisabled } : p
      ));
      if (postAnalytics && postAnalytics.postId === postId) {
        setPostAnalytics({ ...postAnalytics, commentsDisabled: response.data.post.commentsDisabled });
      }
    } catch (error) {
      console.error('Error toggling comments:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      hashtag: '',
      startDate: '',
      endDate: '',
      reported: false
    });
    setPage(1);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && posts.length === 0) {
    return (
      <div className="admin-posts">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-posts">
      <div className="posts-header">
        <button className="back-link" onClick={() => history.push('/admin/dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="posts-title">
          <h1>Post Management</h1>
          <p>Manage and moderate all posts</p>
        </div>
      </div>

      <div className="posts-content">
        {/* Posts List Section */}
        <div className="posts-list-section">
          {/* Filters */}
          <div className="filters-section">
            <div className="filters-row">
              <input
                type="text"
                placeholder="Filter by user ID..."
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
              <input
                type="text"
                placeholder="Filter by hashtag..."
                value={filters.hashtag}
                onChange={(e) => handleFilterChange('hashtag', e.target.value)}
              />
              <input
                type="date"
                placeholder="Start date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              <input
                type="date"
                placeholder="End date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.reported}
                  onChange={(e) => handleFilterChange('reported', e.target.checked)}
                />
                <span>Reported only</span>
              </label>
              <button className="clear-btn" onClick={clearFilters}>Clear</button>
            </div>
          </div>

          {/* Stats */}
          <div className="posts-stats">
            <span>Total Posts: <strong>{total}</strong></span>
            <span>Page {page} of {pages}</span>
          </div>

          {/* Posts Table */}
          <div className="posts-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Content</th>
                  <th>Media</th>
                  <th>Likes</th>
                  <th>Comments</th>
                  <th>Posted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr 
                    key={post._id} 
                    className={selectedPost === post._id ? 'selected' : ''}
                  >
                    <td>
                      <div className="user-cell">
                        {post.user?.profilePicture ? (
                          <img 
                            src={post.user.profilePicture.startsWith('/uploads') 
                              ? `http://localhost:5000${post.user.profilePicture}` 
                              : post.user.profilePicture
                            } 
                            alt="" 
                            className="user-avatar" 
                          />
                        ) : (
                          <div className="user-avatar-placeholder">
                            {post.user?.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <div>{post.user?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {post.user?.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="post-content">
                        {post.content.substring(0, 50)}
                        {post.content.length > 50 ? '...' : ''}
                      </div>
                      {post.hashtags?.length > 0 && (
                        <div className="hashtags">
                          {post.hashtags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="hashtag">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {post.mediaType === 'image' && `📷 ${post.images?.length || 0}`}
                      {post.mediaType === 'video' && `🎥 ${post.videos?.length || 0}`}
                      {post.mediaType === 'none' && '-'}
                    </td>
                    <td>{post.likes?.length || 0}</td>
                    <td>{post.comments?.length || 0}</td>
                    <td>{formatDate(post.createdAt)}</td>
                    <td>
                      {post.isInappropriate && (
                        <span className="status-badge inappropriate">Inappropriate</span>
                      )}
                      {post.commentsDisabled && (
                        <span className="status-badge disabled">No Comments</span>
                      )}
                      {post.reportCount > 0 && (
                        <span className="status-badge reported">⚠️ {post.reportCount}</span>
                      )}
                      {!post.isInappropriate && !post.commentsDisabled && post.reportCount === 0 && (
                        <span className="status-badge active">Active</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={() => handleViewAnalytics(post._id)}
                          title="View Analytics"
                        >
                          📊
                        </button>
                        <button 
                          className="action-btn warn"
                          onClick={() => handleMarkInappropriate(post._id, !post.isInappropriate)}
                          title={post.isInappropriate ? "Mark Appropriate" : "Mark Inappropriate"}
                        >
                          {post.isInappropriate ? '✓' : '⚠️'}
                        </button>
                        <button 
                          className="action-btn block"
                          onClick={() => handleToggleComments(post._id)}
                          title={post.commentsDisabled ? "Enable Comments" : "Disable Comments"}
                        >
                          {post.commentsDisabled ? '🔊' : '🔇'}
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => setShowDeleteConfirm(post._id)}
                          title="Delete Post"
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

          {/* Pagination */}
          <div className="pagination">
            <button 
              onClick={() => setPage(page - 1)} 
              disabled={page === 1}
            >
              Previous
            </button>
            <span>Page {page} of {pages}</span>
            <button 
              onClick={() => setPage(page + 1)} 
              disabled={page === pages}
            >
              Next
            </button>
          </div>
        </div>

        {/* Post Analytics Panel */}
        {postAnalytics && (
          <div className="post-analytics-panel">
            <div className="analytics-header">
              <h2>Post Analytics</h2>
              <button onClick={() => { setSelectedPost(null); setPostAnalytics(null); }}>✕</button>
            </div>

            <div className="post-info">
              <div className="user-info-section">
                {postAnalytics.user?.profilePicture ? (
                  <img src={postAnalytics.user.profilePicture} alt="" className="profile-pic" />
                ) : (
                  <div className="profile-pic-placeholder">
                    {postAnalytics.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <h3>{postAnalytics.user?.name}</h3>
                <p>{postAnalytics.user?.email}</p>
              </div>

              <div className="post-content-full">
                <p>{postAnalytics.content}</p>
                {postAnalytics.images?.length > 0 && (
                  <div className="post-media">
                    {postAnalytics.images.map((img, i) => (
                      <img key={i} src={img} alt="" />
                    ))}
                  </div>
                )}
                {postAnalytics.location && (
                  <div className="post-location">📍 {postAnalytics.location}</div>
                )}
              </div>

              <div className="analytics-stats">
                <h4>Engagement Metrics</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">❤️</div>
                    <div className="stat-value">{postAnalytics.likesCount}</div>
                    <div className="stat-label">Likes</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💬</div>
                    <div className="stat-value">{postAnalytics.commentsCount}</div>
                    <div className="stat-label">Comments</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-value">{postAnalytics.sharesCount}</div>
                    <div className="stat-label">Shares</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🔖</div>
                    <div className="stat-value">{postAnalytics.savesCount}</div>
                    <div className="stat-label">Saves</div>
                  </div>
                </div>
              </div>

              {postAnalytics.reportCount > 0 && (
                <div className="report-info">
                  <strong>⚠️ Reports: {postAnalytics.reportCount}</strong>
                </div>
              )}

              <div className="admin-actions">
                <button 
                  className={`admin-action-btn ${postAnalytics.isInappropriate ? 'success' : 'warning'}`}
                  onClick={() => handleMarkInappropriate(postAnalytics.postId, !postAnalytics.isInappropriate)}
                >
                  {postAnalytics.isInappropriate ? '✓ Mark as Appropriate' : '⚠️ Mark as Inappropriate'}
                </button>
                <button 
                  className="admin-action-btn info"
                  onClick={() => handleToggleComments(postAnalytics.postId)}
                >
                  {postAnalytics.commentsDisabled ? '🔊 Enable Comments' : '🔇 Disable Comments'}
                </button>
                <button 
                  className="admin-action-btn danger"
                  onClick={() => setShowDeleteConfirm(postAnalytics.postId)}
                >
                  🗑️ Delete Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Post</h3>
            <p>Are you sure you want to delete this post? This action cannot be undone and will remove all comments, likes, and related data.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="delete-btn" onClick={() => handleDelete(showDeleteConfirm)}>
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
