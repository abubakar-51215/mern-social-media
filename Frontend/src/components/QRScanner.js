import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './QRScanner.css';

const QRScanner = ({ isOpen, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const history = useHistory();

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        setError('');
        
        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(scanQRCode, 500);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Simple detection: Look for high contrast patterns
      // In a production app, you'd use a proper QR code library
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simulate QR detection (in real app, use jsQR or similar library)
      detectQRPattern(imageData);
    }
  };

  const detectQRPattern = (imageData) => {
    // This is a simplified simulation
    // In production, use a library like jsQR
    // For demo purposes, we'll allow manual URL input
  };

  const handleManualInput = (url) => {
    if (url && url.includes('/profile/')) {
      const userId = url.split('/profile/')[1];
      stopCamera();
      history.push(`/profile/${userId}`);
      onClose();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes('/profile/')) {
        handleManualInput(text);
      } else {
        setError('Invalid profile URL');
      }
    } catch (err) {
      setError('Unable to read clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="qr-scanner-overlay" onClick={onClose}>
      <div className="qr-scanner-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-scanner-header">
          <h2>Scan QR Code</h2>
          <button className="scanner-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="qr-scanner-body">
          {error ? (
            <div className="scanner-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button className="retry-btn" onClick={startCamera}>
                🔄 Retry Camera
              </button>
            </div>
          ) : (
            <div className="scanner-video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="scanner-video"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              <div className="scanner-overlay-frame">
                <div className="scanner-corner scanner-corner-tl"></div>
                <div className="scanner-corner scanner-corner-tr"></div>
                <div className="scanner-corner scanner-corner-bl"></div>
                <div className="scanner-corner scanner-corner-br"></div>
              </div>

              {scanning && (
                <div className="scanner-line"></div>
              )}
            </div>
          )}

          <div className="scanner-instructions">
            <p>📱 Point your camera at a profile QR code</p>
            <p className="scanner-subtitle">Or paste a profile link below</p>
          </div>

          <div className="manual-input-section">
            <button 
              className="paste-btn" 
              onClick={handlePasteFromClipboard}
            >
              📋 Paste from Clipboard
            </button>
          </div>
        </div>

        <div className="qr-scanner-footer">
          <button className="scanner-btn scanner-btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
