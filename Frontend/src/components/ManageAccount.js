import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './ManageAccountRefined.css';
import { toast } from './Toast';

const ManageAccount = ({ isOpen, onClose }) => {
    const history = useHistory();
    const [activeTab, setActiveTab] = useState('profile');
    const [user, setUser] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showRemoveAccountMenu, setShowRemoveAccountMenu] = useState(false);
    const [showEmailMenu, setShowEmailMenu] = useState(null);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);
    const [showAddEmailModal, setShowAddEmailModal] = useState(false);
    const [showVerifyEmailModal, setShowVerifyEmailModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [verificationError, setVerificationError] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [emailToVerify, setEmailToVerify] = useState('');
    const [signOutOtherDevices, setSignOutOtherDevices] = useState(true);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!isOpen) return;
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);

        // Listen for profile updates
        const handleProfileUpdate = (e) => {
            const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (e.detail?.profilePicture) {
                updatedUser.profilePicture = e.detail.profilePicture;
            }
            setUser(updatedUser);
        };

        window.addEventListener('profileUpdated', handleProfileUpdate);

        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, [isOpen]);

    const handlePasswordChange = async () => {
        if (!passwordData.newPassword || !passwordData.confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://talhasghar.site/api/users/set-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    newPassword: passwordData.newPassword,
                    signOutOtherDevices: signOutOtherDevices
                })
            });

            if (response.ok) {
                alert('Password set successfully');
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setSignOutOtherDevices(true);
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to set password');
            }
        } catch (error) {
            alert('Error setting password');
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'Delete account') {
            alert('Please type "Delete account" to confirm');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://talhasghar.site/api/users/delete-account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Use the onClose callback and let parent handle navigation
                if (onClose) onClose();
                // Navigate to home page smoothly
                history.push('/');
            } else {
                alert('Failed to delete account');
            }
        } catch (error) {
            alert('Error deleting account');
        }
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            if (profileImage) {
                formData.append('profilePicture', profileImage);
            }

            const response = await fetch('https://talhasghar.site/api/users/update-profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                alert('Profile updated successfully');
                setShowProfileModal(false);
                setProfileImage(null);
                setProfileImagePreview(null);
            } else {
                alert('Failed to update profile');
            }
        } catch (error) {
            alert('Error updating profile');
        }
    };

    const handleRemoveConnectedAccount = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://talhasghar.site/api/users/remove-google-account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = { ...user, googleId: null };
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                alert('Google account disconnected successfully');
                setShowRemoveAccountMenu(false);
            } else {
                alert('Failed to remove connected account');
            }
        } catch (error) {
            alert('Error removing connected account');
        }
    };

    const handleAddEmailClick = () => {
        setShowAddEmailModal(true);
        setNewEmail('');
    };

    const handleSendVerificationCode = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://talhasghar.site/api/users/send-verification-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: newEmail })
            });

            if (response.ok) {
                setEmailToVerify(newEmail);
                setShowAddEmailModal(false);
                setShowVerifyEmailModal(true);
                setVerificationCode(['', '', '', '', '', '']);
                setVerificationError(false);
                setVerificationSuccess(false);
            } else {
                const data = await response.json();
                console.error('Backend error:', data);
                alert(data.message || data.error || 'Failed to send verification code');
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Error sending verification code: ' + error.message);
        }
    };

    const handleVerificationCodeChange = (index, value) => {
        if (value.length > 1) return;
        if (value && !/^[0-9]$/.test(value)) return;

        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);
        setVerificationError(false);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.querySelector(`input[name="code-${index + 1}"]`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleVerifyEmail = async () => {
        const code = verificationCode.join('');
        if (code.length !== 6) {
            alert('Please enter the complete 6-digit code');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://talhasghar.site/api/users/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    email: emailToVerify,
                    code: code 
                })
            });

            if (response.ok) {
                setVerificationSuccess(true);
                setVerificationError(false);
                const data = await response.json();
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                setTimeout(() => {
                    setShowVerifyEmailModal(false);
                    setVerificationCode(['', '', '', '', '', '']);
                    setVerificationSuccess(false);
                }, 1500);
            } else {
                setVerificationError(true);
                setVerificationSuccess(false);
            }
        } catch (error) {
            setVerificationError(true);
            setVerificationSuccess(false);
        }
    };

    const handleResendCode = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://talhasghar.site/api/users/send-verification-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: emailToVerify })
            });

            if (response.ok) {
                alert('Verification code resent successfully');
                setVerificationCode(['', '', '', '', '', '']);
                setVerificationError(false);
            }
        } catch (error) {
            alert('Error resending verification code');
        }
    };

    const handleSetPrimaryEmail = async (emailAddress) => {
        console.log('Setting primary email to:', emailAddress);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://talhasghar.site/api/users/set-primary-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: emailAddress })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Primary email updated:', data);
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                toast.success('Primary email updated successfully');
                setShowEmailMenu(null);
            } else {
                const errorData = await response.json();
                console.error('Failed to set primary email:', errorData);
                toast.error(errorData.message || 'Failed to set primary email');
            }
        } catch (error) {
            console.error('Error setting primary email:', error);
            alert('Error setting primary email: ' + error.message);
        }
    };

    const handleRemoveEmail = async (emailAddress) => {
        console.log('Removing email:', emailAddress);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://talhasghar.site/api/users/remove-email', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: emailAddress })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Email removed:', data);
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                toast.success('Email removed successfully');
                setShowEmailMenu(null);
            } else {
                const errorData = await response.json();
                console.error('Failed to remove email:', errorData);
                toast.error(errorData.message || 'Failed to remove email');
            }
        } catch (error) {
            alert('Error removing email');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="manage-account-overlay" onClick={onClose}>
                <div className="manage-account-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="close-modal-btn" onClick={onClose}>×</button>

                    <div className="manage-account-content">
                        <div className="manage-account-sidebar">
                            <div className="manage-account-header">
                                <h2>Account</h2>
                                <p>Manage your account info.</p>
                            </div>

                            <div className="manage-account-tabs">
                                <button
                                    className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('profile')}
                                >
                                    <span className="tab-icon">👤</span>
                                    <span>Profile</span>
                                </button>

                            </div>

                            <div className="manage-account-sidebar-footer">
                                <span className="clerk-badge">🛡️ Secured by Clerk</span>
                                <span className="dev-mode-badge">⚡ Development mode</span>
                            </div>
                        </div>

                        <div className="manage-account-main">
                            <div className="manage-account-main-content">
                                {activeTab === 'profile' && (
                                    <div className="tab-card">
                                        <div className="tab-card-header">
                                            <h3>Profile details</h3>
                                        </div>
                                        <div className="tab-card-body">
                                            <div className="detail-row">
                                                <div className="detail-label">Email addresses</div>
                                                <div className="detail-value">
                                                    <div className="email-section-wrapper">
                                                        <div className="email-list-content">
                                                            <div>
                                                                <div 
                                                                    className={`email-inline-wrapper-single ${selectedEmail === user?.email ? 'selected' : ''}`}
                                                                    onClick={() => setSelectedEmail(user?.email)}
                                                                >
                                                                    <div className="email-inline-content">
                                                                        <span className="email-address">{user?.email}</span>
                                                                        <span className="primary-pill">Primary</span>
                                                                    </div>
                                                                </div>
                                                                {user?.secondaryEmails && user.secondaryEmails.length > 0 && (
                                                                    <div className="email-list-vertical">
                                                                        {user.secondaryEmails.map((email, index) => (
                                                                            <div 
                                                                                key={index} 
                                                                                className={`email-inline-wrapper-single ${selectedEmail === email.address ? 'selected' : ''}`}
                                                                                onClick={() => setSelectedEmail(email.address)}
                                                                            >
                                                                                <div className="email-inline-content">
                                                                                    <span className="email-address">{email.address}</span>
                                                                                    <span className="verified-pill">Verified</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <div style={{marginTop: '14px', marginLeft: '0'}}>
                                                                    <button className="text-link" onClick={handleAddEmailClick} style={{paddingLeft: '0'}}>+ Add email address</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="email-actions">
                                                            <button 
                                                                className="more-options-btn" 
                                                                onClick={() => {
                                                                    if (selectedEmail && selectedEmail !== user?.email) {
                                                                        setShowEmailMenu(showEmailMenu === 'emails' ? null : 'emails');
                                                                    }
                                                                }}
                                                                aria-label="Email options"
                                                                disabled={!selectedEmail || selectedEmail === user?.email}
                                                                style={{ 
                                                                    opacity: (!selectedEmail || selectedEmail === user?.email) ? 0.4 : 1,
                                                                    cursor: (!selectedEmail || selectedEmail === user?.email) ? 'not-allowed' : 'pointer'
                                                                }}
                                                            >
                                                                ⋯
                                                            </button>
                                                            {showEmailMenu === 'emails' && selectedEmail && selectedEmail !== user?.email && (
                                                                <div className="email-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleSetPrimaryEmail(selectedEmail); }}>Set as primary</button>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveEmail(selectedEmail); }} className="remove-option">Remove email</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="detail-row no-border">
                                                <div className="detail-label">Connected accounts</div>
                                                <div className="detail-value">
                                                    <div className="connected-inline-wrapper">
                                                        <div className="connected-account">
                                                            <div className="google-logo-wrapper">
                                                                <svg viewBox="0 0 24 24" className="google-logo-icon">
                                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                                                </svg>
                                                            </div>
                                                            <span className="connected-service">Google</span>
                                                            <span className="connected-email"> • {user?.email}</span>
                                                        </div>
                                                        <div className="connected-account-actions">
                                                            <button 
                                                                className="more-options-btn" 
                                                                aria-label="More connected account actions"
                                                                onClick={() => setShowRemoveAccountMenu(!showRemoveAccountMenu)}
                                                            >
                                                                ⋯
                                                            </button>
                                                            {showRemoveAccountMenu && (
                                                                <div className="remove-account-menu">
                                                                    <button onClick={handleRemoveConnectedAccount}>Remove</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}


                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showPasswordModal && (
                <div className="password-modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="password-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Set password</h3>
                        <div className="password-input-group">
                            <label htmlFor="new-password">New password</label>
                            <div className="password-input-wrapper">
                                <input
                                    id="new-password"
                                    type="password"
                                    placeholder=""
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                />
                                <button className="toggle-password" type="button">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="password-input-group">
                            <label htmlFor="confirm-password">Confirm password</label>
                            <div className="password-input-wrapper">
                                <input
                                    id="confirm-password"
                                    type="password"
                                    placeholder=""
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                />
                                <button className="toggle-password" type="button">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={signOutOtherDevices}
                                    onChange={(e) => setSignOutOtherDevices(e.target.checked)}
                                />
                                <span className="checkbox-text">
                                    <strong>Sign out of all other devices</strong>
                                    <br />
                                    <span className="checkbox-hint">It is recommended to sign out of all other devices which may have used your old password.</span>
                                </span>
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => {
                                setShowPasswordModal(false);
                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                setSignOutOtherDevices(true);
                            }}>Cancel</button>
                            <button onClick={handlePasswordChange}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete account</h3>
                        <p>Are you sure you want to delete your account? Some associated data may be retained. To request full data deletion, please contact support.</p>
                        <p className="warning-text">This action is permanent and irreversible.</p>
                        <div className="delete-input-group">
                            <label htmlFor="delete-confirm">Type "Delete account" below to continue.</label>
                            <input
                                id="delete-confirm"
                                type="text"
                                placeholder="Delete account"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                            />
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => {
                                setShowDeleteModal(false);
                                setDeleteConfirmText('');
                            }}>Cancel</button>
                            <button className="delete-confirm-btn" onClick={handleDeleteAccount}>Delete account</button>
                        </div>
                    </div>
                </div>
            )}

            {showProfileModal && (
                <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
                    <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 style={{marginBottom: '18px'}}>Update profile</h3>
                        <div style={{ position: 'relative', minHeight: '120px', marginBottom: '0' }}>
                            <div style={{ position: 'absolute', top: '-18px', left: '0', zIndex: 2 }}>
                                <div className="profile-avatar-large" style={{ boxShadow: '0 4px 16px rgba(99,102,241,0.18), 0 1.5px 6px rgba(0,0,0,0.08)', border: '4px solid #fff' }}>
                                    {profileImagePreview || user?.profilePicture ? (
                                        <img src={profileImagePreview || (user.profilePicture && user.profilePicture.startsWith('/uploads') ? `https://talhasghar.site${user.profilePicture}` : user.profilePicture)} alt="Profile" />
                                    ) : (
                                        <div className="avatar-placeholder-large" style={{ fontWeight: '700', fontSize: '22px' }}>
                                            {user?.name?.charAt(0).toUpperCase() || 'A'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ marginLeft: '110px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', paddingTop: '10px' }}>
                                <label htmlFor="profile-upload" className="upload-btn" style={{marginBottom: '0', fontWeight: '500', fontSize: '15px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)'}}>Upload</label>
                                <input
                                    id="profile-upload"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleProfileImageChange}
                                />
                                <span className="upload-hint" style={{fontSize: '15px', color: '#737373', marginTop: '2px'}}>Recommended size 1:1, up to 10MB.</span>
                            </div>
                        </div>
                        <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '38px', gap: '18px' }}>
                            <button style={{ minWidth: '110px', fontSize: '17px', fontWeight: '500' }} onClick={() => {
                                setShowProfileModal(false);
                                setProfileImage(null);
                                setProfileImagePreview(null);
                            }}>Cancel</button>
                            <button style={{ background: '#a3a3a3', color: '#fff', minWidth: '110px', fontWeight: '600', fontSize: '17px' }} onClick={handleSaveProfile}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddEmailModal && (
                <div className="add-email-modal-overlay" onClick={() => setShowAddEmailModal(false)}>
                    <div className="add-email-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Add email address</h3>
                        <p className="modal-description">You'll need to verify this email address before it can be added to your account.</p>
                        <div className="email-input-group">
                            <label htmlFor="new-email">Email address</label>
                            <input
                                id="new-email"
                                type="email"
                                placeholder="Enter your email address"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                            />
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setShowAddEmailModal(false)}>Cancel</button>
                            <button onClick={handleSendVerificationCode}>Add</button>
                        </div>
                    </div>
                </div>
            )}

            {showVerifyEmailModal && (
                <div className="verify-email-modal-overlay" onClick={() => setShowVerifyEmailModal(false)}>
                    <div className="verify-email-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-verify-modal" onClick={() => setShowVerifyEmailModal(false)}>×</button>
                        <h3>Verification required</h3>
                        <p className="verify-description">Enter the code sent to your email to continue</p>
                        <p className="verify-email">{emailToVerify}</p>
                        <div className="verification-code-inputs">
                            {verificationCode.map((digit, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    name={`code-${index}`}
                                    value={digit}
                                    onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                                    className={`code-input ${verificationError ? 'error' : ''} ${verificationSuccess ? 'success' : ''}`}
                                />
                            ))}
                        </div>
                        {verificationError && <p className="verification-error">⚠ Incorrect code</p>}
                        {verificationSuccess && <p className="verification-success">✓ Success</p>}
                        <p className="resend-link">
                            Didn't receive a code? <button onClick={handleResendCode}>Resend (30)</button>
                        </p>
                        <button className="verify-continue-btn" onClick={handleVerifyEmail}>
                            Continue ▶
                        </button>
                        <div className="verify-footer">
                            <p>Secured by <strong>🔐 clerk</strong></p>
                            <p className="dev-mode-text">Development mode</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ManageAccount;
