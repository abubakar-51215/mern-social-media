import React, { useState, useRef, useEffect } from 'react';
import './VoiceMessageModal.css';

const VoiceMessageModal = ({ audioBlob, recordingTime, onSend, onCancel }) => {
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audioBlob) return;

    // Capture the ref targets at effect run to avoid stale ref warnings
    const audioElement = audioRef.current;

    try {
      // Only create URL once and store in ref
      if (!blobUrlRef.current) {
        const url = URL.createObjectURL(audioBlob);
        blobUrlRef.current = url;
        console.log(`📁 Audio blob URL created: ${url}, Size: ${audioBlob.size} bytes`);
      }
      
      if (audioElement && blobUrlRef.current) {
        // Set the blob URL to ALL source elements for compatibility
        const sourceElements = audioElement.querySelectorAll('source');
        sourceElements.forEach(source => {
          source.src = blobUrlRef.current;
        });
        
        audioElement.load();
        console.log(`✅ Audio loaded into ${sourceElements.length} source elements`);
      }
    } catch (error) {
      console.error('❌ Error creating object URL:', error);
    }

    return () => {
      const blobUrl = blobUrlRef.current;
      
      if (audioElement) {
        audioElement.pause();
      }
      if (blobUrl) {
        console.log('🧹 Cleaning up blob URL on unmount');
        URL.revokeObjectURL(blobUrl);
        blobUrlRef.current = null;
      }
    };
  }, [audioBlob]);

  const togglePlayback = () => {
    if (!audioRef.current) {
      console.error('❌ Audio element not ready');
      return;
    }
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        console.log('⏸️ Audio paused');
        setIsPlaying(false);
      } else {
        audioRef.current.currentTime = 0;
        audioRef.current.playbackRate = 1.0;
        
        console.log('🎵 Attempting to play audio...', {
          src: audioRef.current.src,
          currentSrc: audioRef.current.currentSrc,
          readyState: audioRef.current.readyState,
          networkState: audioRef.current.networkState,
          canPlayType: audioRef.current.canPlayType('audio/webm')
        });
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Audio playing successfully at 1.0x speed');
              setIsPlaying(true);
            })
            .catch(error => {
              // Ignore AbortError - it happens when element is removed or already playing
              if (error.name === 'AbortError') {
                console.warn('⚠️ Play was aborted (element removed or already playing)');
                setIsPlaying(true); // Still set to playing state
              } else {
                console.error('❌ Play error:', error);
                setIsPlaying(false);
              }
            });
        } else {
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('❌ Error in togglePlayback:', error);
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0 || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const duration = audioRef.current.duration;
      console.log(`✅ Audio metadata loaded - Duration: ${duration}s`);
      if (!isNaN(duration) && isFinite(duration)) {
        setDuration(duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="voice-message-modal-overlay" onClick={onCancel}>
      <div className="voice-message-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎤 Voice Message</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-content">
          <div className="waveform-container">
            <div className="waveform-bars">
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
          </div>

          <div className="player-controls">
            <button 
              className="play-btn" 
              onClick={togglePlayback}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            <div className="progress-container">
              <span className="time-display">{formatTime(currentTime)}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                ></div>
                <input 
                  type="range" 
                  min="0" 
                  max={duration > 0 ? duration : recordingTime} 
                  value={currentTime}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    if (audioRef.current) {
                      audioRef.current.currentTime = newTime;
                      setCurrentTime(newTime);
                    }
                  }}
                  className="progress-slider"
                />
              </div>
              <span className="time-display">{formatTime(duration > 0 ? duration : recordingTime)}</span>
            </div>
          </div>

          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            preload="metadata"
            onPlay={() => {
              if (audioRef.current) {
                audioRef.current.playbackRate = 1.0;
                console.log('🎵 Preview playback started - Speed: 1.0x');
              }
            }}
            onLoadStart={() => {
              console.log('📥 Audio loading started');
            }}
            onProgress={() => {
              if (audioRef.current) {
                console.log('📊 Progress - Buffered:', audioRef.current.buffered.length);
              }
            }}
            onCanPlay={() => {
              console.log(`✅ Audio can play - Duration: ${audioRef.current?.duration || 'loading'}s, Sources loaded`);
            }}
            onError={(e) => {
              // Only log real errors, suppress harmless ones during playback
              const target = e.target;
              if (target && target.error && target.error.code && target.error.code !== 4) {
                console.warn('⚠️ Audio error during preview:', {
                  errorCode: target.error.code,
                  errorMessage: target.error.message
                });
              }
            }}
          >
            <source type="audio/webm" />
            <source type="audio/wav" />
            <source type="audio/ogg" />
            Your browser does not support the audio element.
          </audio>
        </div>

        <div className="modal-actions">
          <button className="action-btn discard-btn" onClick={onCancel}>
            🗑️ Discard
          </button>
          <button className="action-btn send-btn" onClick={onSend}>
            ✓ Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessageModal;
