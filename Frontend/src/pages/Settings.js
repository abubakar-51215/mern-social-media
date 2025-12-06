import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { toast } from '../components/Toast';
import {
  getSettings,
  updatePrivacySettings,
  updateNotificationSettings,
  setup2FA,
  verify2FA,
  disable2FA,
  getBackupCodes,
  changePassword,
  deleteAccount,
  getBlockedUsers,
  unblockUser
} from '../api';
import { getUser, logout } from '../utils/auth';
import './Settings.css';

const Settings = () => {
  const history = useHistory();
  const currentUser = getUser();
  
  // Active section
  const [activeSection, setActiveSection] = useState('privacy');
  
  // Privacy settings
  const [isPrivate, setIsPrivate] = useState(false);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  const [privacySettings, setPrivacySettings] = useState({
    whoCanMessage: 'everyone',
    whoCanSeeOnlineStatus: 'everyone',
    whoCanSeeLastSeen: 'everyone',
    whoCanSeePosts: 'everyone',
    whoCanSeeStories: 'everyone',
    whoCanSeeFriends: 'everyone',
    allowTagging: true,
    allowMentions: true
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    followNotifications: true,
    friendRequestNotifications: true
  });
  
  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  
  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  
  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Delete account
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Device info
  const [deviceInfo, setDeviceInfo] = useState({
    browser: '',
    os: '',
    ip: 'Loading...',
    time: ''
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  
  // Helper functions for device info
  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome ' + (ua.match(/Chrome\/(\d+)/)?.[1] || '');
    if (ua.includes('Firefox')) return 'Firefox ' + (ua.match(/Firefox\/(\d+)/)?.[1] || '');
    if (ua.includes('Safari')) return 'Safari';
    return 'Unknown';
  };
  
  const getOSInfo = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown';
  };
  
  const fetchIPAddress = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setDeviceInfo(prev => ({ ...prev, ip: data.ip }));
    } catch (error) {
      setDeviceInfo(prev => ({ ...prev, ip: 'Unable to fetch' }));
    }
  };
  
  useEffect(() => {
    loadSettings();
    // Initialize device info
    const info = {
      browser: getBrowserInfo(),
      os: getOSInfo(),
      ip: 'Loading...',
      time: new Date().toLocaleString()
    };
    setDeviceInfo(info);
    fetchIPAddress();
  }, []);
  
  useEffect(() => {
    if (activeSection === 'blocked') {
      loadBlockedUsers();
    }
  }, [activeSection]);
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setIsPrivate(data.isPrivate || false);
      setShowActivityStatus(data.showActivityStatus !== false);
      setPrivacySettings(prev => ({ ...prev, ...data.privacySettings }));
      setNotificationSettings(prev => ({ ...prev, ...data.notificationSettings }));
      setTwoFactorEnabled(data.twoFactorEnabled || false);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };
  
  const loadBlockedUsers = async () => {
    try {
      setLoadingBlocked(true);
      const response = await getBlockedUsers();
      setBlockedUsers(response.data || []);
    } catch (error) {
      console.error('Error loading blocked users:', error);
    } finally {
      setLoadingBlocked(false);
    }
  };
  
  const handlePrivacyUpdate = async (updates) => {
    try {
      await updatePrivacySettings(updates);
      toast.success('Privacy settings updated');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update settings');
    }
  };
  
  const handleNotificationUpdate = async (key, value) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    
    try {
      await updateNotificationSettings({ notificationSettings: newSettings });
      toast.success('Notification settings updated');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Failed to update settings');
    }
  };
  
  const handleTogglePrivate = async () => {
    const newValue = !isPrivate;
    setIsPrivate(newValue);
    await handlePrivacyUpdate({ isPrivate: newValue });
  };
  
  const handleToggleActivityStatus = async () => {
    const newValue = !showActivityStatus;
    setShowActivityStatus(newValue);
    await handlePrivacyUpdate({ showActivityStatus: newValue });
  };
  
  const handlePrivacySettingChange = async (key, value) => {
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    await handlePrivacyUpdate({ privacySettings: newSettings });
  };
  
  // 2FA Functions
  const handleSetup2FA = async () => {
    try {
      const data = await setup2FA();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShow2FASetup(true);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast.error(error.response?.data?.message || 'Failed to setup 2FA');
    }
  };
  
  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    
    try {
      const data = await verify2FA(verificationCode);
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setShow2FASetup(false);
      setTwoFactorEnabled(true);
      setVerificationCode('');
      toast.success('Two-factor authentication enabled!');
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast.error(error.response?.data?.message || 'Invalid verification code');
    }
  };
  
  const handleDisable2FA = async () => {
    try {
      await disable2FA(disablePassword, disableCode);
      setTwoFactorEnabled(false);
      setShow2FADisable(false);
      setDisableCode('');
      setDisablePassword('');
      toast.success('Two-factor authentication disabled');
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast.error(error.response?.data?.message || 'Failed to disable 2FA');
    }
  };
  
  const handleGetBackupCodes = async () => {
    const password = prompt('Enter your password to generate new backup codes:');
    if (!password) return;
    
    try {
      const data = await getBackupCodes(password);
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      toast.success('New backup codes generated');
    } catch (error) {
      console.error('Error getting backup codes:', error);
      toast.error(error.response?.data?.message || 'Failed to generate backup codes');
    }
  };
  
  // Password change
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };
  
  // Unblock user
  const handleUnblock = async (userId) => {
    try {
      await unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User unblocked');
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };
  
  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    try {
      await deleteAccount(deletePassword, deleteConfirmation);
      toast.success('Account deleted');
      logout();
      history.push('/auth');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };
  
  const menuItems = [
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'blocked', label: 'Blocked Users', icon: '🚫' },
    { id: 'account', label: 'Account', icon: '👤' }
  ];
  
  if (loading) {
    return (
      <div className="settings-page">
        <Sidebar />
        <div className="settings-content">
          <div className="settings-loading">
            <div className="spinner"></div>
            <p>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="settings-page">
      <Sidebar />
      <div className="settings-content">
        <div className="settings-container">
          <div className="settings-sidebar">
            <h2>Settings</h2>
            <nav className="settings-menu">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  className={`menu-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="settings-main">
            {/* Privacy Section */}
            {activeSection === 'privacy' && (
              <div className="settings-section">
                <h3>Privacy Settings</h3>
                
                <div className="setting-group">
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Private Account</span>
                      <span className="setting-description">
                        Only approved followers can see your posts and stories
                      </span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={handleTogglePrivate}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Show Activity Status</span>
                      <span className="setting-description">
                        Let others see when you're online
                      </span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={showActivityStatus}
                        onChange={handleToggleActivityStatus}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                
                <div className="setting-group">
                  <h4>Who can...</h4>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Message you</span>
                    </div>
                    <select
                      value={privacySettings.whoCanMessage}
                      onChange={(e) => handlePrivacySettingChange('whoCanMessage', e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends">Friends Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">See your online status</span>
                    </div>
                    <select
                      value={privacySettings.whoCanSeeOnlineStatus}
                      onChange={(e) => handlePrivacySettingChange('whoCanSeeOnlineStatus', e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends">Friends Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">See your last seen</span>
                    </div>
                    <select
                      value={privacySettings.whoCanSeeLastSeen}
                      onChange={(e) => handlePrivacySettingChange('whoCanSeeLastSeen', e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends">Friends Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">See your stories</span>
                    </div>
                    <select
                      value={privacySettings.whoCanSeeStories}
                      onChange={(e) => handlePrivacySettingChange('whoCanSeeStories', e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends">Friends Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">See your friends list</span>
                    </div>
                    <select
                      value={privacySettings.whoCanSeeFriends}
                      onChange={(e) => handlePrivacySettingChange('whoCanSeeFriends', e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends">Friends Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                </div>
                
                <div className="setting-group">
                  <h4>Interactions</h4>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Allow Tagging</span>
                      <span className="setting-description">
                        Let others tag you in posts and photos
                      </span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={privacySettings.allowTagging}
                        onChange={(e) => handlePrivacySettingChange('allowTagging', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Allow Mentions</span>
                      <span className="setting-description">
                        Let others mention you in comments
                      </span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={privacySettings.allowMentions}
                        onChange={(e) => handlePrivacySettingChange('allowMentions', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="settings-section">
                <h3>Notification Settings</h3>
                
                <div className="setting-group">
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Email Notifications</span>
                      <span className="setting-description">
                        Receive notifications via email
                      </span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => handleNotificationUpdate('emailNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Push Notifications</span>
                      <span className="setting-description">
                        Receive push notifications in browser
                      </span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => handleNotificationUpdate('pushNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                
                <div className="setting-group">
                  <h4>Notify me about...</h4>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Messages</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.messageNotifications}
                        onChange={(e) => handleNotificationUpdate('messageNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Likes</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.likeNotifications}
                        onChange={(e) => handleNotificationUpdate('likeNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Comments</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.commentNotifications}
                        onChange={(e) => handleNotificationUpdate('commentNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">New Followers</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.followNotifications}
                        onChange={(e) => handleNotificationUpdate('followNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Friend Requests</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.friendRequestNotifications}
                        onChange={(e) => handleNotificationUpdate('friendRequestNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="settings-section">
                <h3>Security</h3>
                
                <div className="setting-group">
                  <h4>Two-Factor Authentication</h4>
                  <p className="section-description">
                    Add an extra layer of security to your account by requiring a verification code in addition to your password.
                  </p>
                  
                  {!twoFactorEnabled ? (
                    <button className="btn-primary" onClick={handleSetup2FA}>
                      🔐 Enable Two-Factor Authentication
                    </button>
                  ) : (
                    <div className="tfa-enabled">
                      <div className="tfa-status">
                        <span className="status-icon">✅</span>
                        <span>Two-factor authentication is enabled</span>
                      </div>
                      <div className="tfa-actions">
                        <button className="btn-secondary" onClick={handleGetBackupCodes}>
                          Get Backup Codes
                        </button>
                        <button className="btn-danger" onClick={() => setShow2FADisable(true)}>
                          Disable 2FA
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="setting-group">
                  <h4>Password</h4>
                  <p className="section-description">Set or change your password</p>
                  <button className="btn-secondary" onClick={() => setShowPasswordChange(true)}>
                    🔑 Change Password
                  </button>
                </div>
                
                <div className="setting-group">
                  <h4>Active Devices</h4>
                  <div className="device-info-container">
                    <div className="device-item">
                      <span className="device-icon">💻</span>
                      <div className="device-details">
                        <div className="device-header">
                          <span className="device-os">{deviceInfo.os}</span>
                          <span className="device-badge">This device</span>
                        </div>
                        <div className="device-info-list">
                          <div>{deviceInfo.browser}</div>
                          <div>{deviceInfo.ip}</div>
                          <div>{deviceInfo.time}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Blocked Users Section */}
            {activeSection === 'blocked' && (
              <div className="settings-section">
                <h3>Blocked Users</h3>
                <p className="section-description">
                  Blocked users can't see your profile, posts, or message you.
                </p>
                
                {loadingBlocked ? (
                  <div className="loading-state">Loading...</div>
                ) : blockedUsers.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🚫</span>
                    <p>You haven't blocked anyone</p>
                  </div>
                ) : (
                  <div className="blocked-list">
                    {blockedUsers.map(user => (
                      <div key={user._id} className="blocked-user">
                        <div className="user-info">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="user-avatar" />
                          ) : (
                            <div className="avatar-placeholder">{user.name?.charAt(0)}</div>
                          )}
                          <div className="user-details">
                            <span className="user-name">{user.name}</span>
                            <span className="user-email">{user.email}</span>
                          </div>
                        </div>
                        <button
                          className="btn-unblock"
                          onClick={() => handleUnblock(user._id)}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Account Section */}
            {activeSection === 'account' && (
              <div className="settings-section">
                <h3>Account Settings</h3>
                
                <div className="setting-group">
                  <h4>Account Information</h4>
                  <div className="account-info">
                    <div className="info-item">
                      <span className="info-label">Name</span>
                      <span className="info-value">{currentUser?.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email</span>
                      <span className="info-value">{currentUser?.email}</span>
                    </div>
                  </div>
                </div>
                
                <div className="setting-group danger-zone">
                  <h4>⚠️ Danger Zone</h4>
                  <p className="section-description">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button className="btn-danger" onClick={() => setShowDeleteAccount(true)}>
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="modal-overlay" onClick={() => setShow2FASetup(false)}>
          <div className="modal-content tfa-modal" onClick={e => e.stopPropagation()}>
            <h3>Setup Two-Factor Authentication</h3>
            
            <div className="tfa-setup-steps">
              <div className="step">
                <span className="step-number">1</span>
                <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
              </div>
              
              <div className="qr-container">
                <img src={qrCode} alt="2FA QR Code" />
              </div>
              
              <div className="step">
                <span className="step-number">2</span>
                <p>Or enter this code manually:</p>
                <code className="secret-code">{secret}</code>
              </div>
              
              <div className="step">
                <span className="step-number">3</span>
                <p>Enter the 6-digit code from your app:</p>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="code-input"
                  maxLength={6}
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShow2FASetup(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleVerify2FA}>
                Verify & Enable
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <div className="modal-overlay" onClick={() => setShowBackupCodes(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Backup Codes</h3>
            <p className="warning-text">
              ⚠️ Save these codes in a safe place. Each code can only be used once.
            </p>
            
            <div className="backup-codes-grid">
              {backupCodes.map((code, index) => (
                <div key={index} className="backup-code">{code}</div>
              ))}
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join('\n'));
                  toast.success('Codes copied to clipboard');
                }}
              >
                📋 Copy Codes
              </button>
              <button className="btn-primary" onClick={() => setShowBackupCodes(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Disable 2FA Modal */}
      {show2FADisable && (
        <div className="modal-overlay" onClick={() => setShow2FADisable(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Disable Two-Factor Authentication</h3>
            <p>Enter your password and a verification code to disable 2FA.</p>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            
            <div className="form-group">
              <label>Verification Code (or backup code)</label>
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="000000"
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShow2FADisable(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDisable2FA}>
                Disable 2FA
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Change Password Modal */}
      {showPasswordChange && (
        <div className="modal-overlay" onClick={() => setShowPasswordChange(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Change Password</h3>
            
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowPasswordChange(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleChangePassword}>
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <div className="modal-overlay" onClick={() => setShowDeleteAccount(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <h3>⚠️ Delete Account</h3>
            <p className="danger-text">
              This action cannot be undone. All your data, posts, messages, and connections will be permanently deleted.
            </p>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            
            <div className="form-group">
              <label>Type <strong>DELETE</strong> to confirm</label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteAccount(false)}>
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE'}
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
