import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getAdminSettings, updateAdminSettings, resetAdminSettings, exportDatabase, createBackup, listBackups, restoreBackup } from '../api';
import { toast } from '../components/Toast';
import './AdminSettings.css';

const AdminSettings = () => {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    platformName: 'MERN Social Media',
    platformDescription: 'Connect, Share, and Build Relationships',
    maintenanceMode: false,
    
    // Security Settings
    enableTwoFactor: true,
    passwordMinLength: 8,
    sessionTimeout: 24,
    rateLimitingEnabled: true,
    maxLoginAttempts: 5,
    
    // Moderation Settings
    autoModeration: true,
    reportThreshold: 5,
    autoSuspensionEnabled: true,
    suspensionAfterReports: 10,
    contentFilter: true,
    
    // Email Settings
    emailNotifications: true,
    notificationEmail: 'admin@mern-social.com',
    smtpEnabled: true,
    
    // Feature Settings
    enableStories: true,
    enableGroups: true,
    enableMessaging: true,
    enableReports: true,
    
    // Data Settings
    backupFrequency: 'weekly',
    logRetention: 90
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await getAdminSettings();
      setSettings(response.data);
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setUnsavedChanges(true);
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateAdminSettings(settings);
      toast.success('Settings saved successfully!');
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      try {
        setIsSaving(true);
        await resetAdminSettings();
        await loadSettings();
        toast.success('Settings reset to defaults');
      } catch (error) {
        console.error('Error resetting settings:', error);
        toast.error('Failed to reset settings');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleExportDatabase = async () => {
    try {
      setIsSaving(true);
      toast.info('Exporting database...');
      const response = await exportDatabase();
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `database-export-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Database exported successfully!');
    } catch (error) {
      console.error('Error exporting database:', error);
      toast.error('Failed to export database');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsSaving(true);
      toast.info('Creating backup...');
      const response = await createBackup();
      toast.success(response.data.message || 'Backup created successfully!');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error(error.response?.data?.message || 'Failed to create backup');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!window.confirm('Are you sure you want to restore from backup? This will replace all current data!')) {
      return;
    }

    try {
      setIsSaving(true);
      toast.info('Fetching backups...');
      const response = await listBackups();
      const backups = response.data.backups;

      if (backups.length === 0) {
        toast.error('No backups available');
        setIsSaving(false);
        return;
      }

      // Show latest backup
      const latestBackup = backups[0];
      if (window.confirm(`Restore from backup "${latestBackup.name}"? This action cannot be undone!`)) {
        toast.info('Restoring backup...');
        await restoreBackup(latestBackup.name);
        toast.success('Backup restored successfully! Please refresh the page.');
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error(error.response?.data?.message || 'Failed to restore backup');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="admin-settings-container">
      {/* Header */}
      <div className="settings-header">
        <button className="back-link" onClick={() => history.push('/admin/dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="settings-title">
          <h1>Admin Settings</h1>
          <p>Configure platform settings and preferences</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sidebar Navigation */}
        <div className="settings-sidebar">
          <nav className="settings-nav">
            <button 
              className={`nav-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <span className="icon">🌐</span>
              General
            </button>
            <button 
              className={`nav-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <span className="icon">🔒</span>
              Security
            </button>
            <button 
              className={`nav-tab ${activeTab === 'moderation' ? 'active' : ''}`}
              onClick={() => setActiveTab('moderation')}
            >
              <span className="icon">⚡</span>
              Moderation
            </button>
            <button 
              className={`nav-tab ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => setActiveTab('email')}
            >
              <span className="icon">📧</span>
              Email
            </button>
            <button 
              className={`nav-tab ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              <span className="icon">✨</span>
              Features
            </button>
            <button 
              className={`nav-tab ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              <span className="icon">💾</span>
              Data & Backup
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading settings...</p>
            </div>
          ) : (
            <>
          {/* General Settings */}
          {activeTab === 'general' && (
            <SettingSection title="General Settings">
              <SettingItem label="Platform Name">
                <input 
                  type="text"
                  value={settings.platformName}
                  onChange={(e) => handleInputChange('platformName', e.target.value)}
                  placeholder="Enter platform name"
                />
              </SettingItem>

              <SettingItem label="Platform Description">
                <textarea 
                  value={settings.platformDescription}
                  onChange={(e) => handleInputChange('platformDescription', e.target.value)}
                  placeholder="Enter platform description"
                  rows="3"
                />
              </SettingItem>

              <SettingItem label="Maintenance Mode" type="toggle">
                <div className="toggle-switch">
                  <input 
                    type="checkbox"
                    id="maintenance"
                    checked={settings.maintenanceMode}
                    onChange={() => handleToggle('maintenanceMode')}
                  />
                  <label htmlFor="maintenance"></label>
                </div>
                <span className="toggle-label">
                  {settings.maintenanceMode ? 'Enabled - Platform is under maintenance' : 'Disabled'}
                </span>
              </SettingItem>
            </SettingSection>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <SettingSection title="Security Settings">
              <SettingItem label="Two-Factor Authentication" type="toggle">
                <div className="toggle-switch">
                  <input 
                    type="checkbox"
                    id="2fa"
                    checked={settings.enableTwoFactor}
                    onChange={() => handleToggle('enableTwoFactor')}
                  />
                  <label htmlFor="2fa"></label>
                </div>
              </SettingItem>

              <SettingItem label="Minimum Password Length">
                <input 
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={(e) => handleInputChange('passwordMinLength', parseInt(e.target.value))}
                  min="6"
                  max="20"
                />
              </SettingItem>

              <SettingItem label="Session Timeout (hours)">
                <input 
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                  min="1"
                  max="168"
                />
              </SettingItem>

              <SettingItem label="Rate Limiting" type="toggle">
                <div className="toggle-switch">
                  <input 
                    type="checkbox"
                    id="rateLimit"
                    checked={settings.rateLimitingEnabled}
                    onChange={() => handleToggle('rateLimitingEnabled')}
                  />
                  <label htmlFor="rateLimit"></label>
                </div>
              </SettingItem>

              <SettingItem label="Max Login Attempts">
                <input 
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
                  min="2"
                  max="20"
                />
              </SettingItem>
            </SettingSection>
          )}

          {/* Moderation Settings */}
          {activeTab === 'moderation' && (
            <SettingSection title="Moderation Settings">
              <SettingItem label="Auto-Moderation" type="toggle">
                <div className="toggle-switch">
                  <input 
                    type="checkbox"
                    id="autoMod"
                    checked={settings.autoModeration}
                    onChange={() => handleToggle('autoModeration')}
                  />
                  <label htmlFor="autoMod"></label>
                </div>
              </SettingItem>

              <SettingItem label="Report Threshold for Review">
                <input 
                  type="number"
                  value={settings.reportThreshold}
                  onChange={(e) => handleInputChange('reportThreshold', parseInt(e.target.value))}
                  min="1"
                  max="50"
                />
                <small>Content is flagged for review after this many reports</small>
              </SettingItem>

              <SettingItem label="Auto-Suspension" type="toggle">
                <div className="toggle-switch">
                  <input 
                    type="checkbox"
                    id="autoSuspend"
                    checked={settings.autoSuspensionEnabled}
                    onChange={() => handleToggle('autoSuspensionEnabled')}
                  />
                  <label htmlFor="autoSuspend"></label>
                </div>
              </SettingItem>

              <SettingItem label="Suspend After Reports">
                <input 
                  type="number"
                  value={settings.suspensionAfterReports}
                  onChange={(e) => handleInputChange('suspensionAfterReports', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
                <small>User is suspended after receiving this many reports</small>
              </SettingItem>

              <SettingItem label="Content Filter" type="toggle">
                <div className="toggle-switch">
                  <input 
                    type="checkbox"
                    id="contentFilter"
                    checked={settings.contentFilter}
                    onChange={() => handleToggle('contentFilter')}
                  />
                  <label htmlFor="contentFilter"></label>
                </div>
              </SettingItem>
            </SettingSection>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <SettingSection title="Email Settings">
              <SettingItem label="Email Notifications" type="toggle">
                <div className="toggle-switch">
                  <input 
                    type="checkbox"
                    id="emailNotif"
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                  />
                  <label htmlFor="emailNotif"></label>
                </div>
              </SettingItem>

              <SettingItem label="Notification Email Address">
                <input 
                  type="email"
                  value={settings.notificationEmail}
                  onChange={(e) => handleInputChange('notificationEmail', e.target.value)}
                  placeholder="admin@example.com"
                />
              </SettingItem>

              <SettingItem label="SMTP Enabled" type="toggle">
                <div className="toggle-switch">
                  <input 
                    type="checkbox"
                    id="smtp"
                    checked={settings.smtpEnabled}
                    onChange={() => handleToggle('smtpEnabled')}
                  />
                  <label htmlFor="smtp"></label>
                </div>
              </SettingItem>

              <div className="setting-hint">
                <p>📧 Configure SMTP settings in environment variables for email functionality</p>
              </div>
            </SettingSection>
          )}

          {/* Feature Settings */}
          {activeTab === 'features' && (
            <SettingSection title="Feature Management">
              <SettingItem label="Stories" type="toggle">
                <div className="toggle-switch">
                  <input 
                    type="checkbox"
                    id="stories"
                    checked={settings.enableStories}
                    onChange={() => handleToggle('enableStories')}
                  />
                  <label htmlFor="stories"></label>
                </div>
                <span className="toggle-label">
                  {settings.enableStories ? 'Enabled - Users can post 24-hour stories' : 'Disabled'}
                </span>
              </SettingItem>

              <SettingItem label="Groups" type="toggle">
                <div className="toggle-switch">
                  <input 
                    type="checkbox"
                    id="groups"
                    checked={settings.enableGroups}
                    onChange={() => handleToggle('enableGroups')}
                  />
                  <label htmlFor="groups"></label>
                </div>
                <span className="toggle-label">
                  {settings.enableGroups ? 'Enabled - Users can create and join groups' : 'Disabled'}
                </span>
              </SettingItem>

              <SettingItem label="Messaging" type="toggle">
                <div className="toggle-switch">
                  <input 
                    type="checkbox"
                    id="messaging"
                    checked={settings.enableMessaging}
                    onChange={() => handleToggle('enableMessaging')}
                  />
                  <label htmlFor="messaging"></label>
                </div>
                <span className="toggle-label">
                  {settings.enableMessaging ? 'Enabled - Users can send direct messages' : 'Disabled'}
                </span>
              </SettingItem>

              <SettingItem label="Reports" type="toggle">
                <div className="toggle-switch">
                  <input 
                    type="checkbox"
                    id="reports"
                    checked={settings.enableReports}
                    onChange={() => handleToggle('enableReports')}
                  />
                  <label htmlFor="reports"></label>
                </div>
                <span className="toggle-label">
                  {settings.enableReports ? 'Enabled - Users can report inappropriate content' : 'Disabled'}
                </span>
              </SettingItem>
            </SettingSection>
          )}

          {/* Data & Backup Settings */}
          {activeTab === 'data' && (
            <SettingSection title="Data & Backup Settings">
              <SettingItem label="Backup Frequency">
                <select 
                  value={settings.backupFrequency}
                  onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </SettingItem>

              <SettingItem label="Log Retention (days)">
                <input 
                  type="number"
                  value={settings.logRetention}
                  onChange={(e) => handleInputChange('logRetention', parseInt(e.target.value))}
                  min="7"
                  max="365"
                />
              </SettingItem>

              <SettingItem label="Data Management">
                <div className="button-group">
                  <button 
                    className="btn-secondary" 
                    onClick={handleExportDatabase}
                    disabled={isSaving}
                  >
                    💾 Export Database
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={handleCreateBackup}
                    disabled={isSaving}
                  >
                    📦 Create Backup
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={handleRestoreBackup}
                    disabled={isSaving}
                  >
                    🔄 Restore Backup
                  </button>
                </div>
              </SettingItem>

              <div className="setting-hint">
                <p>⚠️ Data management operations should be performed during low-traffic periods</p>
              </div>
            </SettingSection>
          )}

          {/* Save Actions */}
          <div className="settings-actions">
            {unsavedChanges && <span className="unsaved-indicator">⚠️ You have unsaved changes</span>}
            <div className="button-group">
              <button className="btn-secondary" onClick={handleReset} disabled={isSaving}>
                🔄 Reset to Defaults
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSave}
                disabled={!unsavedChanges || isSaving}
              >
                {isSaving ? '💾 Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable Settings Section Component
const SettingSection = ({ title, children }) => (
  <div className="setting-section">
    <h2>{title}</h2>
    <div className="section-content">
      {children}
    </div>
  </div>
);

// Reusable Setting Item Component
const SettingItem = ({ label, type, children }) => (
  <div className={`setting-item ${type === 'toggle' ? 'toggle-item' : ''}`}>
    <label className="setting-label">{label}</label>
    <div className="setting-input">
      {children}
    </div>
  </div>
);

export default AdminSettings;
