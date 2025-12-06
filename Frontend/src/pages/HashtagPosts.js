import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getPostsByHashtag } from '../api';
import PostCard from '../components/PostCard';
import './HashtagPosts.css';

const HashtagPosts = () => {
  const { tag } = useParams();
  const history = useHistory();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPostsByHashtag(tag);
        setPosts(data);
      } catch (err) {
        console.error('Error fetching hashtag posts:', err);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    if (tag) {
      fetchPosts();
    }
  }, [tag]);

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  return (
    <div className="hashtag-posts-page">
      <div className="hashtag-header">
        <button className="back-btn" onClick={() => history.goBack()}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div className="hashtag-info">
          <h1>#{tag}</h1>
          <p>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>
        </div>
      </div>

      <div className="hashtag-posts-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading posts...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">#</div>
            <h3>No posts yet</h3>
            <p>Be the first to post with #{tag}</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HashtagPosts;
