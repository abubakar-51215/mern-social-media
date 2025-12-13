import React, { useState, useRef, useEffect } from 'react';
import './VoicePlayerModal.css';

const VoicePlayerModal = ({ audioUrl, senderName, timestamp, onClose }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Validate and log audio URL
  useEffect(() => {
    if (audioUrl) {
      console.log(`📁 VoicePlayerModal initialized with Audio URL: ${audioUrl}`);
      
      // Test if the URL is accessible
      fetch(audioUrl, { method: 'HEAD' })
        .then(response => {
          console.log(`📊 URL Test - Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}, Content-Length: ${response.headers.get('content-length')}`);
        })
        .catch(error => {
          console.error(`❌ URL Test Failed:`, error);
        });
    }
  }, [audioUrl]);

  const togglePlayback = () => {
    if (!audioRef.current) {
      console.error('❌ Audio element not available');
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
          canPlayType_webm: audioRef.current.canPlayType('audio/webm'),
          canPlayType_wav: audioRef.current.canPlayType('audio/wav'),
          canPlayType_mpeg: audioRef.current.canPlayType('audio/mpeg')
        });
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Audio playing successfully at 1.0x speed');
              setIsPlaying(true);
            })
            .catch(error => {
              // Ignore AbortError - it's not a real error
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
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
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
      const dur = audioRef.current.duration;
      if (!isNaN(dur) && isFinite(dur)) {
        setDuration(dur);
        console.log(`✅ Audio loaded - Duration: ${dur.toFixed(2)}s`);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="voice-player-modal-overlay" onClick={onClose}>
      <div className="voice-player-modal" onClick={(e) => e.stopPropagation()}>
        <div className="player-modal-header">
          <div className="sender-info">
            <h3>🎤 {senderName}</h3>
            <p className="message-time">{timestamp}</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="player-modal-content">
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

          <button 
            className="play-btn large" 
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
                max={duration > 0 ? duration : 0} 
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
            <span className="time-display">{formatTime(duration)}</span>
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
                console.log('🎵 Playback started - Speed: 1.0x');
              }
            }}
            onCanPlay={() => {
              const dur = audioRef.current?.duration;
              console.log(`✅ Audio playable - Duration: ${dur ? dur.toFixed(2) : 'loading'}s, URL: ${audioUrl}`);
            }}
            onError={(e) => {
              // Only log real errors, suppress harmless ones during playback
              const target = e.target;
              if (target && target.error && target.error.code && target.error.code !== 4) {
                console.warn('⚠️ Audio error in player:', {
                  errorCode: target.error.code,
                  errorMessage: target.error.message,
                  src: audioUrl
                });
              }
            }}
          >
            <source src={audioUrl} type="audio/webm" />
            <source src={audioUrl} type="audio/wav" />
            <source src={audioUrl} type="audio/mpeg" />
            <source src={audioUrl} type="audio/ogg" />
            Your browser does not support the audio element.
          </audio>
        </div>

        <div className="player-modal-actions">
          <button className="action-btn close-action-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoicePlayerModal;
