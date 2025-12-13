import React, { useState, useRef, useEffect } from 'react';
import { addReaction, removeReaction, deleteMessage, editMessage } from '../api';
import { toast } from './Toast';
import './EnhancedChatBubble.css';

const EnhancedChatBubble = ({ message, isCurrentUser, currentUser, onDelete, onForward, onEdit, activeReactionId, setActiveReactionId, isGroupChat, showSenderName, onViewProfile, onReactionUpdate }) => {
  const WAVE_WIDTH = 260;
  const WAVE_HEIGHT = 60;
  const BAR_COUNT = 40;
  const BASELINE_Y = 30;
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [actualDuration, setActualDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const isOwn = isCurrentUser;
  const audioRef = useRef(null);
  const editInputRef = useRef(null);
  const reactionRef = useRef(null);
  
  // Check if this message's reaction picker is open
  const showReactions = activeReactionId === message._id;

  // Format duration helper
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load audio metadata on the inline audio element and compute actual duration
  useEffect(() => {
    if (!(message.messageType === 'audio' && message.audio)) return;
    const audio = audioRef.current;
    if (!audio) return;

    // Show a quick estimate immediately from file size (~50KB/sec) while metadata loads
    if (message.fileSize && message.fileSize > 0) {
      const estimated = Math.ceil(message.fileSize / 50000);
      setEstimatedDuration(estimated);
    }

    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      if (!isNaN(dur) && isFinite(dur) && dur > 0) {
        setActualDuration(dur);
      }
    };

    const handleCanPlay = () => {
      const dur = audio.duration;
      if (!isNaN(dur) && isFinite(dur) && dur > 0) {
        setActualDuration(dur);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e) => {
      // Non-fatal: keep estimated duration if available
      console.warn('Audio inline error:', {
        code: e.target?.error?.code,
        message: e.target?.error?.message,
        src: e.target?.currentSrc
      });
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.preload = 'metadata';
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [message.audio, message.messageType, message.fileSize]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.currentTime = 0;
        audio.playbackRate = 1.0;
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              if (err?.name === 'AbortError') {
                // Non-fatal
                setIsPlaying(true);
              } else {
                console.error('Inline play error:', err);
                setIsPlaying(false);
              }
            });
        } else {
          setIsPlaying(true);
        }
      }
    } catch (e) {
      console.error('togglePlayback error:', e);
      setIsPlaying(false);
    }
  };

  const handleWaveSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const total = actualDuration || audio.duration || estimatedDuration || 0;
    if (total <= 0) return;
    const pct = Math.min(Math.max(clickX / width, 0), 1);
    const newTime = pct * total;
    try {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    } catch (err) {
      console.warn('Seek error:', err);
    }
  };

  // Focus edit input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [isEditing, editText.length]);

  // Handle click outside to close reaction picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reactionRef.current && !reactionRef.current.contains(event.target)) {
        if (showReactions) {
          setActiveReactionId(null);
        }
      }
    };

    if (showReactions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReactions, setActiveReactionId]);

  const reactions = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

  const handleReaction = async (emoji) => {
    try {
      // Optimistically update the UI
      if (onReactionUpdate) {
        onReactionUpdate(message._id, emoji, currentUser, 'add');
      }
      setActiveReactionId(null);
      
      // Then make the API call
      await addReaction(message._id, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
      // Revert on error
      if (onReactionUpdate) {
        onReactionUpdate(message._id, null, currentUser, 'remove');
      }
    }
  };

  const handleRemoveReaction = async () => {
    try {
      // Optimistically update the UI
      if (onReactionUpdate) {
        onReactionUpdate(message._id, null, currentUser, 'remove');
      }
      
      // Then make the API call
      await removeReaction(message._id);
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  const handleDelete = () => {
    toast.confirm('Delete this message?', {
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteMessage(message._id);
          if (onDelete) onDelete(message._id);
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }
    });
  };

  const handleStartEdit = () => {
    // Check if message is within 10 minute edit window
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const maxEditTime = 10 * 60 * 1000; // 10 minutes
    
    if (messageAge > maxEditTime) {
      toast.error('Cannot edit message after 10 minutes');
      return;
    }
    
    setEditText(message.text || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text || '');
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      toast.error('Message cannot be empty');
      return;
    }
    
    if (editText.trim() === message.text) {
      setIsEditing(false);
      return;
    }

    try {
      await editMessage(message._id, editText.trim());
      if (onEdit) onEdit(message._id, editText.trim());
      setIsEditing(false);
      toast.success('Message edited');
    } catch (error) {
      console.error('Error editing message:', error);
      const errorMsg = error.response?.data?.message || 'Failed to edit message';
      toast.error(errorMsg);
      setIsEditing(false);
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Check if message can be edited (within 10 minutes)
  const canEdit = () => {
    if (!isOwn || message.isDeleted) return false;
    // Only text messages can be edited (default to text if not specified)
    const msgType = message.messageType || 'text';
    if (msgType !== 'text') return false;
    // Must have text content
    if (!message.text) return false;
    // Check time window
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const maxEditTime = 10 * 60 * 1000; // 10 minutes
    return messageAge <= maxEditTime;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`enhanced-message ${isOwn ? 'own' : 'other'} ${isGroupChat ? 'group-message' : ''}`}>
      <div className="message-container">
        {!isOwn && (
          <div 
            className="message-avatar clickable"
            onClick={() => onViewProfile && onViewProfile(message.sender._id)}
          >
            {message.sender.profilePicture ? (
              <img src={`http://localhost:5000${message.sender.profilePicture}`} alt="" />
            ) : (
              <div className="avatar-placeholder">
                {message.sender.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
        
        <div className="message-content-wrapper">
          {/* Sender name for group chats */}
          {showSenderName && (
            <div 
              className="group-sender-name clickable"
              onClick={() => onViewProfile && onViewProfile(message.sender._id)}
            >
              {message.sender.name}
            </div>
          )}
          {/* Actions and Reaction Picker - appears above message */}
          <div ref={reactionRef} className={`message-hover-actions ${showReactions ? 'show-reactions' : ''}`}>
            {showReactions ? (
              <div className="reaction-picker-above">
                {reactions.map((emoji, idx) => (
                  <button
                    key={idx}
                    className="reaction-option"
                    onClick={() => handleReaction(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="action-buttons-above">
                <button 
                  className="chat-action-btn"
                  onClick={() => setActiveReactionId(showReactions ? null : message._id)}
                  title="React"
                >
                  😊
                </button>
                {canEdit() && (
                  <button 
                    className="chat-action-btn"
                    onClick={handleStartEdit}
                    title="Edit"
                  >
                    ✏️
                  </button>
                )}
                {isOwn && !message.isDeleted && (
                  <button 
                    className="chat-action-btn"
                    onClick={handleDelete}
                    title="Delete"
                  >
                    🗑️
                  </button>
                )}
                {!message.isDeleted && (
                  <button 
                    className="chat-action-btn"
                    onClick={() => onForward && onForward(message)}
                    title="Forward"
                  >
                    ➡️
                  </button>
                )}
              </div>
            )}
          </div>

          <div 
            className="message-bubble"
            onContextMenu={(e) => {
              e.preventDefault();
              setShowOptions(!showOptions);
            }}
          >
            {message.isDeleted ? (
              <div className="deleted-message">
                <span className="deleted-icon">🚫</span>
                <span className="deleted-text">{message.text}</span>
              </div>
            ) : (
              <>
                {message.messageType === 'image' && message.image && (
                  <div className="message-image">
                    <img src={`http://localhost:5000${message.image}`} alt="Shared" />
                  </div>
                )}
                
                {message.messageType === 'video' && message.video && (
                  <div className="message-video">
                    <video controls>
                      <source src={`http://localhost:5000${message.video}`} type="video/mp4" />
                    </video>
                  </div>
                )}
                
                {message.messageType === 'audio' && message.audio && (
                  <div className="message-audio">
                    <button 
                      className="audio-play-btn" 
                      onClick={togglePlayback}
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? '⏸️' : '▶️'}
                    </button>
                    <div className="audio-waveform" onClick={handleWaveSeek}>
                      {/* Base wave - gray bars */}
                      <svg className="wave-base" viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`} preserveAspectRatio="none">
                        {Array.from({ length: BAR_COUNT }, (_, i) => {
                          const t = i / BAR_COUNT;
                          const amplitude = 0.25 + 0.75 * Math.abs(Math.sin(2.6 * Math.PI * t)) * (0.6 + 0.4 * Math.sin(0.8 * Math.PI * t));
                          const h = 8 + amplitude * 32; // bar height
                          const x = 4 + i * ((WAVE_WIDTH - 8) / BAR_COUNT);
                          const y1 = BASELINE_Y - h / 2;
                          const y2 = BASELINE_Y + h / 2;
                          return (
                            <line
                              key={`base-${i}`}
                              x1={x}
                              y1={y1}
                              x2={x}
                              y2={y2}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          );
                        })}
                      </svg>
                      {/* Fill wave - colored bars showing progress */}
                      {(() => {
                        const audio = audioRef.current;
                        const total = actualDuration || audio?.duration || estimatedDuration || 0;
                        const pct = total > 0 ? Math.min(Math.max((currentTime / total) * 100, 0), 100) : 0;
                        return (
                          <div className="wave-fill" style={{ width: `${pct}%` }}>
                            <svg viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`} preserveAspectRatio="none">
                              {Array.from({ length: BAR_COUNT }, (_, i) => {
                                const t = i / BAR_COUNT;
                                const amplitude = 0.25 + 0.75 * Math.abs(Math.sin(2.6 * Math.PI * t)) * (0.6 + 0.4 * Math.sin(0.8 * Math.PI * t));
                                const h = 8 + amplitude * 32;
                                const x = 4 + i * ((WAVE_WIDTH - 8) / BAR_COUNT);
                                const y1 = BASELINE_Y - h / 2;
                                const y2 = BASELINE_Y + h / 2;
                                return (
                                  <line
                                    key={`fill-${i}`}
                                    x1={x}
                                    y1={y1}
                                    x2={x}
                                    y2={y2}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                  />
                                );
                              })}
                            </svg>
                          </div>
                        );
                      })()}
                      {/* Playback position thumb */}
                      {(() => {
                        const audio = audioRef.current;
                        const total = actualDuration || audio?.duration || estimatedDuration || 0;
                        const pct = total > 0 ? Math.min(Math.max((currentTime / total) * 100, 0), 100) : 0;
                        const left = (pct / 100) * 100;
                        return <div className="wave-thumb" style={{ left: `${left}%` }} />;
                      })()}
                    </div>
                    <div className="audio-duration">
                      {actualDuration > 0 
                        ? formatDuration(actualDuration)
                        : estimatedDuration > 0
                        ? formatDuration(estimatedDuration)
                        : '0:00'
                      }
                    </div>
                    <audio 
                      ref={audioRef}
                      preload="metadata"
                      onPlay={() => { const a = audioRef.current; if (a) a.playbackRate = 1.0; }}
                    >
                      <source src={`http://localhost:5000${message.audio}`} type="audio/webm" />
                      <source src={`http://localhost:5000${message.audio}`} type="audio/ogg" />
                      <source src={`http://localhost:5000${message.audio}`} type="audio/mpeg" />
                    </audio>
                  </div>
                )}

                {message.messageType === 'file' && message.file && (
                  <div className="message-file">
                    <a 
                      href={`http://localhost:5000${message.file}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="file-download-link"
                      download={message.fileName}
                    >
                      <div className="file-icon">
                        {message.fileName?.endsWith('.pdf') ? '📄' :
                         message.fileName?.endsWith('.doc') || message.fileName?.endsWith('.docx') ? '📝' :
                         message.fileName?.endsWith('.xls') || message.fileName?.endsWith('.xlsx') ? '📊' :
                         message.fileName?.endsWith('.ppt') || message.fileName?.endsWith('.pptx') ? '📑' :
                         message.fileName?.endsWith('.zip') || message.fileName?.endsWith('.rar') ? '🗜️' :
                         message.fileName?.endsWith('.txt') ? '📃' :
                         message.fileName?.endsWith('.csv') ? '📈' : '📎'}
                      </div>
                      <div className="file-info">
                        <span className="file-name">{message.fileName || 'Document'}</span>
                        <span className="file-size">
                          {message.fileSize ? (
                            message.fileSize < 1024 * 1024 
                              ? `${(message.fileSize / 1024).toFixed(1)} KB`
                              : `${(message.fileSize / (1024 * 1024)).toFixed(1)} MB`
                          ) : ''}
                        </span>
                      </div>
                      <div className="file-download-icon">⬇️</div>
                    </a>
                  </div>
                )}
                
                {message.text && !isEditing && (
                  <>
                    {message.isStoryReply && (
                      <div className="story-reply-context">
                        <div className="story-context-label">Replied to your story</div>
                        {message.questionText && (
                          <div className="story-question-text">
                            {message.questionText}
                          </div>
                        )}
                        <div className="story-context-message">
                          {message.text}
                        </div>
                      </div>
                    )}
                    {!message.isStoryReply && (
                      <span className="message-text">{message.text}</span>
                    )}
                  </>
                )}
                
                {isEditing && (
                  <div className="edit-message-container">
                    <input
                      ref={editInputRef}
                      type="text"
                      className="edit-message-input"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      placeholder="Edit message..."
                    />
                    <div className="edit-actions">
                      <button className="edit-cancel-btn" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                      <button className="edit-save-btn" onClick={handleSaveEdit}>
                        Save
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Footer for all message types */}
                <span className="message-footer">
                  {message.isEdited && <span className="edited-label">edited</span>}
                  <span className="message-time">{formatTime(message.createdAt)}</span>
                  {isOwn && (
                    <span className="message-status">
                      {message.read ? '✓✓' : '✓'}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>

          {/* Reactions Display */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="message-reactions-display">
              {Object.entries(
                message.reactions.reduce((acc, reaction) => {
                  acc[reaction.emoji] = acc[reaction.emoji] || { count: 0, users: [] };
                  acc[reaction.emoji].count += 1;
                  // Handle both cases: user as object or user as string ID
                  const reactUserId = reaction.user?._id || reaction.user;
                  acc[reaction.emoji].users.push(reactUserId);
                  return acc;
                }, {})
              ).map(([emoji, data]) => {
                // Check if current user reacted with this emoji
                const currentUserId = currentUser?._id || currentUser?.id;
                const userReactedWithThisEmoji = data.users.some(
                  userId => userId === currentUserId || userId?.toString() === currentUserId
                );
                
                return (
                  <span 
                    key={emoji} 
                    className={`reaction-badge ${userReactedWithThisEmoji ? 'user-reacted' : ''}`}
                    onClick={() => {
                      if (userReactedWithThisEmoji) {
                        handleRemoveReaction();
                      } else {
                        handleReaction(emoji);
                      }
                    }}
                    title={userReactedWithThisEmoji ? 'Click to remove your reaction' : 'Click to react'}
                  >
                    <span className="reaction-emoji">{emoji}</span>
                    {data.count > 1 && <span className="reaction-count">{data.count}</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Inline player only; popup removed */}
    </div>
  );
};

export default EnhancedChatBubble;
