import React, { useState, useRef, useEffect } from 'react';
import VoiceMessageModal from './VoiceMessageModal';
import './VoiceRecorder.css';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      // Stop all audio tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      chunksRef.current = []; // Clear any previous chunks
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;
      
      // Use wav or mp3 MIME type if available, otherwise webm
      const mimeTypes = ['audio/webm', 'audio/wav', 'audio/ogg'];
      let selectedMimeType = 'audio/webm';
      
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log(`🛑 Recording stopped. Total chunks: ${chunksRef.current.length}`);
        const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log(`📊 Total data collected: ${totalSize} bytes (${(totalSize / 1024).toFixed(2)} KB)`);
        
        // Create blob from collected chunks with proper MIME type
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        console.log(`✅ Blob created - Size: ${blob.size} bytes, Type: ${blob.type}, MIME: ${mimeType}`);
        
        // Only set blob if it has actual data
        if (blob.size > 0) {
          setAudioBlob(blob);
        } else {
          console.error('❌ Audio blob is empty');
          alert('Recording failed - no audio data captured');
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('🎙️ Audio track stopped');
        });
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
      };

      // Start recording - collect data every 100ms for continuous capture
      mediaRecorder.start(100);
      console.log('🔴 Recording started with 100ms timeslice');
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    setAudioBlob(null);
    setRecordingTime(0);
    // Clean up blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    onCancel();
  };

  // Create and manage blob URL
  useEffect(() => {
    if (audioBlob) {
      // Clean up old URL if exists
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      // Create new URL only once for this blob
      blobUrlRef.current = URL.createObjectURL(audioBlob);
      console.log(`📁 Blob URL created: ${blobUrlRef.current}`);
    }
    
    return () => {
      // Cleanup on unmount or when blob changes
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [audioBlob]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isRecording && !audioBlob) {
      startRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="voice-recorder">
        <div className="recorder-content">
          {isRecording ? (
            <>
              <div className="recording-indicator">
                <span className="red-dot"></span>
                <span className="recording-text">Recording...</span>
              </div>
              <div className="recording-waveform">
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
              </div>
              <div className="recording-time">{formatTime(recordingTime)}</div>
              <div className="recorder-actions">
                <button className="recorder-btn cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="recorder-btn stop-btn" onClick={stopRecording}>
                  Stop
                </button>
              </div>
            </>
          ) : audioBlob ? (
            <div className="preview-message-indicator">
              <span>🎤 Voice message ready</span>
            </div>
          ) : null}
        </div>
      </div>

      {audioBlob && (
        <VoiceMessageModal
          audioBlob={audioBlob}
          recordingTime={recordingTime}
          onSend={handleSend}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

export default VoiceRecorder;
