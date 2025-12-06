import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { searchUsers } from '../api';
import './GlobalSearch.css';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const history = useHistory();
  const debounceTimer = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    try {
      const response = await searchUsers(searchQuery);
      setResults(response.data.users || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleUserClick = (userId) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    history.push(`/profile/${userId}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      setResults([]);
    }
  };

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-input-container">
        <svg 
          className="search-icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="search-input"
        />
        {query && (
          <button
            className="search-clear"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="search-results-dropdown">
          {loading ? (
            <div className="search-loading">
              <div className="spinner"></div>
              <span>Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="search-results-list">
              {results.map((user) => (
                <div
                  key={user._id}
                  className="search-result-item"
                  onClick={() => handleUserClick(user._id)}
                >
                  <div className="search-result-avatar">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="search-result-info">
                    <div className="search-result-name">{user.name}</div>
                    {user.username && (
                      <div className="search-result-username">@{user.username}</div>
                    )}
                    {user.bio && (
                      <div className="search-result-bio">{user.bio}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="search-no-results">
              <span>No users found for "{query}"</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
