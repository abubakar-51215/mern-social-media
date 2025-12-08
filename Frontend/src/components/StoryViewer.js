import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from './Toast';
import { deleteStory, addStoryReaction, replyToStory, viewStory, votePoll, answerQuestion, getStoryViews } from '../api';
import './StoryViewer.css';

const StoryViewer = ({ stories, initialIndex = 0, onClose, onDelete }) => {
  const history = useHistory();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [selectedPollOption, setSelectedPollOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [pollResults, setPollResults] = useState(null);
  const [questionAnswer, setQuestionAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  const currentStory = stories[currentStoryIndex];
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Check if this is the user's own story
  const isOwnStory = currentStory?.userId && (currentStory.userId === currentUser._id || currentStory.userId === currentUser.id);
  
  const STORY_DURATION = 5000; // 5 seconds per story
  const reactionEmojis = ['❤️', '😂', '😮', '😢', '😡', '👏', '🔥', '🎉'];

  // Music playback functions
  const playMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setIsMusicPlaying(true))
        .catch(err => console.log('Music play failed:', err));
    }
  }, []);

  const pauseMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    }
  }, []);

  const toggleMusic = useCallback(() => {
    if (isMusicPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }, [isMusicPlaying, playMusic, pauseMusic]);

  // Auto-play music when story changes
  useEffect(() => {
    if (currentStory?.music?.previewUrl) {
      // Stop any currently playing music
      pauseMusic();
      
      // Start new music after a brief delay
      const timer = setTimeout(() => {
        playMusic();
      }, 300);

      return () => {
        clearTimeout(timer);
        pauseMusic();
      };
    } else {
      pauseMusic();
    }
  }, [currentStoryIndex, currentStory, playMusic, pauseMusic]);

  // Reset poll/question state when story changes
  useEffect(() => {
    setSelectedPollOption(null);
    setHasVoted(false);
    setPollResults(null);
    setQuestionAnswer('');
    setHasAnswered(false);
    
    // If it's own story and it's a poll, calculate and show results
    if (currentStory?.type === 'poll' && currentStory?.poll?.options && isOwnStory) {
      const options = currentStory.poll.options;
      const totalVotes = options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
      if (totalVotes > 0) {
        const results = options.map(opt => ({
          text: typeof opt === 'string' ? opt : opt.text,
          votes: opt.votes?.length || 0,
          percentage: Math.round((opt.votes?.length || 0) / totalVotes * 100)
        }));
        setPollResults(results);
        setHasVoted(true); // To show results view
      }
    }
  }, [currentStoryIndex, currentStory, isOwnStory]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      history.goBack();
    }
  }, [onClose, history]);

  const handleNext = useCallback(() => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      handleClose();
    }
  }, [currentStoryIndex, stories.length, handleClose]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentStoryIndex, isPaused, handleNext, STORY_DURATION]);

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!isValidObjectId(currentStory.id)) {
      toast.error('Cannot delete sample story');
      return;
    }
    try {
      await deleteStory(currentStory.id);
      
      toast.success('Story deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
      
      if (onDelete) {
        onDelete(currentStory.id);
      }
      handleClose();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('Failed to delete story');
    }
  };

  const handleReaction = async (emoji) => {
    if (!isValidObjectId(currentStory.id)) {
      toast.error('Cannot react to sample story');
      return;
    }
    try {
      await addStoryReaction(currentStory.id, emoji);
      setShowReactions(false);
      toast.success(`Reacted with ${emoji}`);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    if (!isValidObjectId(currentStory.id)) {
      toast.error('Cannot reply to sample story');
      return;
    }
    
    try {
      await replyToStory(currentStory.id, replyText);
      setReplyText('');
      setShowReplyInput(false);
      toast.success('Reply sent!');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  // Helper to check if string is valid MongoDB ObjectId
  const isValidObjectId = (id) => {
    if (!id) return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Handle poll vote
  const handlePollVote = async (optionIndex) => {
    if (hasVoted || isOwnStory) return;
    if (!isValidObjectId(currentStory.id)) {
      toast.error('Cannot vote on sample story');
      return;
    }
    
    setSelectedPollOption(optionIndex);
    setIsPaused(true);
    
    try {
      const response = await votePoll(currentStory.id, optionIndex);
      setHasVoted(true);
      
      // Calculate results from response
      if (response.data?.poll?.options) {
        const options = response.data.poll.options;
        const totalVotes = options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
        const results = options.map(opt => ({
          text: opt.text,
          votes: opt.votes?.length || 0,
          percentage: totalVotes > 0 ? Math.round((opt.votes?.length || 0) / totalVotes * 100) : 0
        }));
        console.log('Poll results:', results);
        setPollResults(results);
      } else {
        // Fallback: if no poll data in response, create results based on current vote
        const options = currentStory.poll?.options || [];
        const results = options.map((opt, idx) => ({
          text: typeof opt === 'string' ? opt : opt.text,
          votes: idx === optionIndex ? 1 : 0,
          percentage: idx === optionIndex ? 100 : 0
        }));
        console.log('Fallback poll results:', results);
        setPollResults(results);
      }
      
      toast.success('Vote submitted!');
    } catch (error) {
      console.error('Error voting:', error);
      toast.error(error.response?.data?.message || 'Failed to submit vote');
      setSelectedPollOption(null);
    }
  };

  // Handle question answer
  const handleQuestionSubmit = async () => {
    if (!questionAnswer.trim() || hasAnswered || isOwnStory) return;
    if (!isValidObjectId(currentStory.id)) {
      toast.error('Cannot answer sample story');
      return;
    }
    
    try {
      await answerQuestion(currentStory.id, questionAnswer);
      setHasAnswered(true);
      toast.success('Answer sent!');
      setQuestionAnswer('');
    } catch (error) {
      console.error('Error answering:', error);
      toast.error(error.response?.data?.message || 'Failed to send answer');
    }
  };

  // Handle showing viewers
  const handleShowViewers = async () => {
    if (!isValidObjectId(currentStory.id)) {
      toast.error('Cannot get viewers for sample story');
      return;
    }
    
    setShowViewers(true);
    setIsPaused(true);
    setLoadingViewers(true);
    
    try {
      const response = await getStoryViews(currentStory.id);
      setViewers(response.data || []);
    } catch (error) {
      console.error('Error fetching viewers:', error);
      toast.error('Failed to load viewers');
    } finally {
      setLoadingViewers(false);
    }
  };

  // Mark story as viewed when opened
  useEffect(() => {
    if (currentStory && currentStory.id && !isOwnStory && isValidObjectId(currentStory.id)) {
      viewStory(currentStory.id).catch(console.error);
    }
  }, [currentStory, isOwnStory]);

  if (!currentStory) return null;

  return (
    <div className="story-viewer-overlay">
      <div className="story-viewer">
        {/* Progress bars */}
        <div className="story-progress-bars">
          {stories.map((_, index) => (
            <div key={index} className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{
                  width: index === currentStoryIndex
                    ? `${progress}%`
                    : index < currentStoryIndex
                    ? '100%'
                    : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Story header */}
        <div className="story-header">
          <div className="story-user-info">
            {currentStory.avatar ? (
              <img src={currentStory.avatar} alt="" className="story-avatar" />
            ) : (
              <div className="story-avatar-placeholder">
                {currentStory.user?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="story-user-details">
              <h3>{currentStory.user}</h3>
              <span>{currentStory.time}</span>
            </div>
          </div>
          <div className="story-header-actions">
            {isOwnStory && (
              <button className="story-delete-btn" onClick={handleDelete} title="Delete story">
                🗑️
              </button>
            )}
            <button className="story-close-btn" onClick={handleClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Story content */}
        <div
          className="story-content"
          onMouseDown={() => !hasVoted && setIsPaused(true)}
          onMouseUp={() => !hasVoted && setIsPaused(false)}
          onTouchStart={() => !hasVoted && setIsPaused(true)}
          onTouchEnd={() => !hasVoted && setIsPaused(false)}
        >
          {currentStory.type === 'create' ? (
            <div className="create-story-placeholder">
              <div className="create-icon">+</div>
              <p>Create Story</p>
            </div>
          ) : currentStory.type === 'question' ? (
            <div
              className="story-question-content"
              style={{ backgroundColor: currentStory.backgroundColor || '#6366f1' }}
            >
              <div className="question-box">
                <span className="question-label">Ask me anything</span>
                <p className="question-text">{currentStory.question?.text || currentStory.text || 'Question'}</p>
                {!isOwnStory && !hasAnswered ? (
                  <div className="question-answer-container">
                    <input 
                      type="text" 
                      placeholder="Type your answer..." 
                      className="question-answer-input"
                      value={questionAnswer}
                      onChange={(e) => setQuestionAnswer(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onKeyPress={(e) => e.key === 'Enter' && handleQuestionSubmit()}
                    />
                    <button 
                      className="question-submit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuestionSubmit();
                      }}
                      disabled={!questionAnswer.trim()}
                    >
                      Send
                    </button>
                  </div>
                ) : !isOwnStory && hasAnswered ? (
                  <div className="question-answered">
                    <span>✓ Answer sent!</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : currentStory.type === 'poll' ? (
            <div
              className="story-poll-content"
              style={{ backgroundColor: currentStory.backgroundColor || '#000000' }}
            >
              <div className="poll-box">
                <div className="poll-question">{currentStory.poll?.question || currentStory.text || 'Poll'}</div>
                <div className="poll-options">
                  {(pollResults || currentStory.poll?.options || []).map((option, index) => {
                    const optionText = typeof option === 'string' ? option : option.text;
                    const isSelected = selectedPollOption === index;
                    const percentage = pollResults ? (pollResults[index]?.percentage ?? 0) : null;
                    const showResults = hasVoted || isOwnStory;
                    
                    return (
                      <div 
                        key={index} 
                        className={`poll-option-btn ${isSelected ? 'selected' : ''} ${showResults ? 'voted' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          console.log('Poll option clicked:', index, 'hasVoted:', hasVoted, 'isOwnStory:', isOwnStory);
                          if (!hasVoted && !isOwnStory) {
                            handlePollVote(index);
                          }
                        }}
                        style={{ cursor: (hasVoted || isOwnStory) ? 'default' : 'pointer' }}
                      >
                        {showResults && percentage !== null && (
                          <div 
                            className="poll-result-bar"
                            style={{ width: `${percentage}%` }}
                          />
                        )}
                        <span className="option-text">{optionText}</span>
                        {showResults && percentage !== null && (
                          <span className="poll-percentage">{percentage}%</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (currentStory.backgroundColor || currentStory.color) && !currentStory.image && !currentStory.media ? (
            <div
              className="story-text-content"
              style={{ backgroundColor: currentStory.backgroundColor || currentStory.color }}
            >
              <p>{currentStory.text}</p>
            </div>
          ) : currentStory.media ? (
            <img src={currentStory.media} alt="Story" className="story-image" />
          ) : currentStory.image ? (
            <img src={currentStory.image} alt="Story" className="story-image" />
          ) : (
            <div
              className="story-text-content"
              style={{ backgroundColor: currentStory.backgroundColor || '#6366f1' }}
            >
              <p>{currentStory.text || 'Story'}</p>
            </div>
          )}

          {/* Music Badge - Instagram Style */}
          {currentStory?.music && (
            <>
              <div className="story-music-display" onClick={toggleMusic}>
                {currentStory.music.albumArt && (
                  <img 
                    src={currentStory.music.albumArt} 
                    alt="Album" 
                    className="music-album-art"
                  />
                )}
                <div className="music-info">
                  <span className="music-track">{currentStory.music.trackName || currentStory.music.title || 'Unknown Track'}</span>
                  <span className="music-artist">{currentStory.music.artistName || currentStory.music.artist || 'Unknown Artist'}</span>
                </div>
                <span className={`music-note ${isMusicPlaying ? 'playing' : ''}`}>
                  {isMusicPlaying ? '⏸' : '▶️'}
                </span>
              </div>
              <audio 
                ref={audioRef}
                src={currentStory.music.previewUrl}
                loop
                preload="auto"
              />
            </>
          )}

          {/* Navigation areas */}
          <div className="story-nav-area left" onClick={handlePrevious} />
          <div className="story-nav-area right" onClick={handleNext} />
        </div>

        {/* Story interaction buttons */}
        {!isOwnStory && (
          <div className="story-actions">
            <button 
              className="story-action-btn"
              onClick={() => setShowReactions(!showReactions)}
              title="React"
            >
              ❤️
            </button>
            <button 
              className="story-action-btn"
              onClick={() => setShowReplyInput(!showReplyInput)}
              title="Reply"
            >
              💬
            </button>
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <div className="story-reactions">
            {reactionEmojis.map(emoji => (
              <button
                key={emoji}
                className="reaction-btn"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Reply input */}
        {showReplyInput && (
          <div className="story-reply-input">
            <input
              type="text"
              placeholder="Send a message..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleReply()}
            />
            <button onClick={handleReply} disabled={!replyText.trim()}>
              Send
            </button>
          </div>
        )}

        {/* Story stats for own stories */}
        {isOwnStory && (currentStory.views > 0 || currentStory.viewsList?.length > 0) && (
          <div className="story-stats" onClick={handleShowViewers} style={{ cursor: 'pointer' }}>
            <span>👁️ {currentStory.views || currentStory.viewsList?.length || 0} views</span>
            {currentStory.reactions?.length > 0 && (
              <span>❤️ {currentStory.reactions.length} reactions</span>
            )}
            {currentStory.replies?.length > 0 && (
              <span>💬 {currentStory.replies.length} replies</span>
            )}
          </div>
        )}

        {/* Viewers Modal */}
        {showViewers && (
          <div className="viewers-modal-overlay" onClick={() => { setShowViewers(false); setIsPaused(false); }}>
            <div className="viewers-modal" onClick={(e) => e.stopPropagation()}>
              <div className="viewers-modal-header">
                <h3>Viewers</h3>
                <button className="close-viewers-btn" onClick={() => { setShowViewers(false); setIsPaused(false); }}>×</button>
              </div>
              <div className="viewers-list">
                {loadingViewers ? (
                  <div className="viewers-loading">Loading...</div>
                ) : viewers.length > 0 ? (
                  viewers.map((viewer, index) => {
                    const profilePic = viewer.user?.profilePicture || viewer.profilePicture;
                    const avatarUrl = profilePic 
                      ? (profilePic.startsWith('http') ? profilePic : `http://localhost:5000${profilePic}`)
                      : null;
                    const userName = viewer.user?.name || viewer.name || 'Unknown User';
                    const initial = userName.charAt(0).toUpperCase();
                    
                    return (
                      <div key={index} className="viewer-item">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={userName} 
                            className="viewer-avatar"
                            onError={(e) => { 
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="viewer-avatar-placeholder" 
                          style={{ display: avatarUrl ? 'none' : 'flex' }}
                        >
                          {initial}
                        </div>
                        <div className="viewer-info">
                          <span className="viewer-name">{userName}</span>
                          <span className="viewer-time">
                            {viewer.viewedAt ? new Date(viewer.viewedAt).toLocaleString() : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-viewers">No viewers yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
