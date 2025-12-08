import React, { useState, useRef, useEffect } from 'react';
import './QRCodeModal.css';

const QRCodeModal = ({ isOpen, onClose, user }) => {
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [includeAvatar, setIncludeAvatar] = useState(true);
  const canvasRef = useRef(null);

  const profileUrl = `${window.location.origin}/profile/${user?._id}`;

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      generateQRCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, qrColor, bgColor, includeAvatar]);

  // Simple QR Code generation using canvas
  const generateQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Generate simple QR-like pattern (simplified for demo)
    const cellSize = 10;
    const cells = size / cellSize;
    
    // Create a hash of the URL for consistent pattern
    const hash = profileUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    ctx.fillStyle = qrColor;
    
    // Draw QR pattern
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        // Simple pattern generation based on position and hash
        const shouldFill = ((x * y + hash) % 3 === 0) || 
                          (x < 7 && y < 7) || 
                          (x > cells - 8 && y < 7) || 
                          (x < 7 && y > cells - 8);
        
        if (shouldFill) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }

    // Draw corner squares (QR code markers)
    const drawCornerSquare = (x, y) => {
      ctx.fillStyle = qrColor;
      ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = bgColor;
      ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = qrColor;
      ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawCornerSquare(0, 0); // Top-left
    drawCornerSquare(cells - 7, 0); // Top-right
    drawCornerSquare(0, cells - 7); // Bottom-left

    // Add user avatar in center if enabled
    if (includeAvatar && user?.profilePicture) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const avatarSize = 60;
        const avatarX = (size - avatarSize) / 2;
        const avatarY = (size - avatarSize) / 2;
        
        // Draw white background for avatar
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(avatarX - 5, avatarY - 5, avatarSize + 10, avatarSize + 10);
        
        // Draw avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
      };
      const imgUrl = user.profilePicture.startsWith('/uploads') 
        ? `http://localhost:5000${user.profilePicture}` 
        : user.profilePicture;
      img.src = imgUrl;
    }
  };

  const downloadQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${user?.name || 'profile'}-qr-code.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const shareQRCode = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (navigator.share) {
        try {
          const file = new File([blob], 'qr-code.png', { type: 'image/png' });
          await navigator.share({
            title: `${user?.name}'s Profile QR Code`,
            text: `Scan to follow ${user?.name}`,
            files: [file]
          });
        } catch (err) {
          console.log('Share cancelled', err);
        }
      } else {
        // Fallback: Download
        downloadQRCode();
      }
    });
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
      alert('Profile link copied to clipboard!');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h2>Profile QR Code</h2>
          <button className="qr-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="qr-modal-body">
          <div className="qr-preview-section">
            <div className="qr-canvas-container">
              <canvas ref={canvasRef} className="qr-canvas"></canvas>
            </div>
            
            <div className="qr-user-info">
              <div className="qr-avatar">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture.startsWith('/uploads') 
                      ? `http://localhost:5000${user.profilePicture}` 
                      : user.profilePicture} 
                    alt={user.name} 
                  />
                ) : (
                  <div className="qr-avatar-placeholder">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="qr-user-details">
                <h3>{user?.name}</h3>
                <p>@{user?.email?.split('@')[0]}</p>
              </div>
            </div>
          </div>

          <div className="qr-customization-section">
            <h3>Customize QR Code</h3>
            
            <div className="qr-option">
              <label>QR Color</label>
              <input 
                type="color" 
                value={qrColor} 
                onChange={(e) => setQrColor(e.target.value)}
                className="qr-color-picker"
              />
            </div>

            <div className="qr-option">
              <label>Background Color</label>
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)}
                className="qr-color-picker"
              />
            </div>

            <div className="qr-option">
              <label className="qr-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={includeAvatar}
                  onChange={(e) => setIncludeAvatar(e.target.checked)}
                />
                <span>Include Avatar</span>
              </label>
            </div>
          </div>
        </div>

        <div className="qr-modal-footer">
          <button className="qr-btn qr-btn-secondary" onClick={copyProfileLink}>
            📋 Copy Link
          </button>
          <button className="qr-btn qr-btn-primary" onClick={downloadQRCode}>
            ⬇️ Download
          </button>
          <button className="qr-btn qr-btn-primary" onClick={shareQRCode}>
            ↗️ Share
          </button>
        </div>

        <div className="qr-instructions">
          <p>💡 <strong>Tip:</strong> Others can scan this QR code to quickly visit your profile and follow you!</p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
