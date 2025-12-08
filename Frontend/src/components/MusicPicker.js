import React, { useState, useEffect, useRef } from 'react';
import './MusicPicker.css';

const MusicPicker = ({ onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const audioRef = useRef(null);

  const formatDuration = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Free music API - using iTunes Search API (no auth required)
  const searchMusic = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=25`
      );
      const data = await response.json();
      
      const formattedResults = data.results.map(track => ({
        id: track.trackId,
        title: track.trackName,
        artist: track.artistName,
        album: track.collectionName,
        duration: formatDuration(track.trackTimeMillis),
        cover: track.artworkUrl60,
        previewUrl: track.previewUrl,
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${track.trackName} ${track.artistName}`)}`
      }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching music:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'search') {
        searchMusic(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeTab]);

  // Trending songs - will auto-fetch from iTunes
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [trendingLoaded, setTrendingLoaded] = useState(false);

  // Fetch trending songs when trending tab is active
  useEffect(() => {
    const fetchTrending = async () => {
      if (activeTab === 'trending' && !trendingLoaded) {
        setIsSearching(true);
        try {
          // Fetch popular songs
          const queries = ['Blinding Lights The Weeknd', 'Levitating Dua Lipa', 'Shape of You Ed Sheeran', 'Heat Waves Glass Animals'];
          const allResults = [];
          
          for (const query of queries) {
            const response = await fetch(
              `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=2`
            );
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              allResults.push(data.results[0]);
            }
          }
          
          const formatted = allResults.map(track => ({
            id: track.trackId,
            title: track.trackName,
            artist: track.artistName,
            album: track.collectionName,
            duration: formatDuration(track.trackTimeMillis),
            cover: track.artworkUrl60,
            previewUrl: track.previewUrl
          }));
          
          setTrendingSongs(formatted);
          setTrendingLoaded(true);
        } catch (error) {
          console.error('Error fetching trending:', error);
        } finally {
          setIsSearching(false);
        }
      }
    };
    
    fetchTrending();
  }, [activeTab, trendingLoaded]);

  const getDisplayedSongs = () => {
    if (activeTab === 'search') {
      return searchResults;
    }
    return trendingSongs;
  };

  const displayedSongs = getDisplayedSongs();

  const handleSelectSong = (song) => {
    setSelectedMusic(song);
  };

  const handlePlayPreview = (song, e) => {
    e.stopPropagation();
    
    if (!song.previewUrl) {
      alert('Preview not available for this song');
      return;
    }

    if (currentlyPlaying === song.id) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
        setCurrentlyPlaying(null);
      }
    } else {
      // Play new song
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(song.previewUrl);
      audioRef.current.play();
      setCurrentlyPlaying(song.id);
      
      audioRef.current.onended = () => {
        setCurrentlyPlaying(null);
      };
    }
  };

  const handleConfirm = () => {
    if (selectedMusic) {
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      onSelect(selectedMusic);
      onClose();
    }
  };

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="music-picker-overlay" onClick={onClose}>
      <div className="music-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="music-picker-header">
          <h2>Add Music</h2>
          <button className="music-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="music-tabs">
          <button
            className={`music-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 Search
          </button>
          <button
            className={`music-tab ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            🔥 Trending
          </button>
        </div>

        <div className="music-search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search any song, artist, or album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && <span className="loading-spinner">⏳</span>}
        </div>

        <div className="music-list">
          {displayedSongs.length > 0 ? (
            displayedSongs.map((song) => (
              <div
                key={song.id}
                className={`music-item ${selectedMusic?.id === song.id ? 'selected' : ''}`}
                onClick={() => handleSelectSong(song)}
              >
                {typeof song.cover === 'string' && song.cover.startsWith('http') ? (
                  <img src={song.cover} alt={song.title} className="music-cover-img" />
                ) : (
                  <div className="music-cover">{song.cover || '🎵'}</div>
                )}
                <div className="music-info">
                  <div className="music-title">{song.title}</div>
                  <div className="music-artist">{song.artist}</div>
                  {song.album && <div className="music-album">{song.album}</div>}
                </div>
                <div className="music-actions">
                  {song.previewUrl && (
                    <button
                      className="play-preview-btn"
                      onClick={(e) => handlePlayPreview(song, e)}
                      title={currentlyPlaying === song.id ? "Pause preview" : "Play preview"}
                    >
                      {currentlyPlaying === song.id ? '⏸' : '▶️'}
                    </button>
                  )}
                  <div className="music-duration">{song.duration}</div>
                </div>
                {selectedMusic?.id === song.id && (
                  <div className="music-check">✓</div>
                )}
              </div>
            ))
          ) : activeTab === 'search' && !searchQuery ? (
            <div className="no-results">
              <span>🎵</span>
              <p>Type to search for any song</p>
              <small>Powered by iTunes</small>
            </div>
          ) : (
            <div className="no-results">
              <span>🎵</span>
              <p>No songs found</p>
            </div>
          )}
        </div>

        <div className="music-picker-footer">
          <button className="music-btn music-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="music-btn music-btn-primary"
            onClick={handleConfirm}
            disabled={!selectedMusic}
          >
            Add Music
          </button>
        </div>
      </div>
    </div>
  );
};

export default MusicPicker;
