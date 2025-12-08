import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useHistory } from 'react-router-dom';
import io from 'socket.io-client';
import './Sidebar.css';
import ManageAccount from './ManageAccount';
import QRCodeModal from './QRCodeModal';
import QRScanner from './QRScanner';

const SOCKET_URL = 'http://localhost:5000';

const Sidebar = () => {
    const location = useLocation();
    const history = useHistory();
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [friendRequests, setFriendRequests] = useState(0);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showManageAccount, setShowManageAccount] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState('light');
    const socketRef = useRef(null);
    const currentUserRef = useRef(null);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        currentUserRef.current = userData;
        setUser(userData);

        // Initialize theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Initialize Socket.io connection
        socketRef.current = io(SOCKET_URL);
        socketRef.current.emit('join', userData._id);

        // Fetch initial counts
        fetchUnreadCounts();
        fetchFriendRequests();

        // Listen for profile updates
        const handleProfileUpdate = (e) => {
            const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (e.detail?.profilePicture) {
                updatedUser.profilePicture = e.detail.profilePicture;
            }
            setUser(updatedUser);
            currentUserRef.current = updatedUser;
        };

        window.addEventListener('profileUpdated', handleProfileUpdate);

        // Listen for new messages
        socketRef.current.on('receiveMessage', (data) => {
            // Increment unread count if not on messages page
            if (location.pathname !== '/messages') {
                setUnreadMessages(prev => prev + 1);
            }
        });

        // Listen for friend request events
        socketRef.current.on('friendRequestReceived', () => {
            setFriendRequests(prev => prev + 1);
        });

        socketRef.current.on('friendRequestAccepted', () => {
            // Optionally show a notification
        });

        // Listen for new notifications (likes, comments, follows)
        socketRef.current.on('newNotification', (data) => {
            // Trigger notification refresh or show toast
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Clear unread messages count when on messages page
    useEffect(() => {
        if (location.pathname === '/messages') {
            // Refetch to get actual count (in case some convos still have unread)
            fetchUnreadCounts();
        }
    }, [location.pathname]);

    // Refetch friend requests when on connections page
    useEffect(() => {
        if (location.pathname === '/connections') {
            // Refetch to get actual count
            fetchFriendRequests();
        }
    }, [location.pathname]);

    const fetchUnreadCounts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/messages/unread/count', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUnreadMessages(data.unreadCount || data.count || 0);
            }
        } catch (error) {
            setUnreadMessages(0);
        }
    };

    const fetchFriendRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setFriendRequests(0);
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/friends/requests', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setFriendRequests(data.length || 0);
            } else {
                setFriendRequests(0);
            }
        } catch (error) {
            setFriendRequests(0);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        history.push('/');
    };

    const menuItems = [
        { path: '/dashboard', icon: '🏠', label: 'Feed', badge: null },
        { path: '/messages', icon: '💬', label: 'Messages', badge: unreadMessages },
        { path: '/connections', icon: '👥', label: 'Connections', badge: friendRequests },
        { path: '/discover', icon: '🔍', label: 'Discover', badge: null },
        { path: '/profile', icon: '👤', label: 'Profile', badge: null },
        { path: '/settings', icon: '⚙️', label: 'Settings', badge: null },
        { path: '/create-post', icon: '✏️', label: 'Create Post', badge: null, isButton: true }
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <Link to="/dashboard" className="logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">pingup</span>
                </Link>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {menuItems.map(item => (
                        <li key={item.path}>
                            <Link 
                                to={item.path} 
                                className={`${location.pathname === item.path ? 'active' : ''} ${item.isButton ? 'create-post-nav-btn' : ''}`}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="notification-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <div className="user-menu-container" ref={userMenuRef}>
                    <div 
                        className="user-profile-trigger"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="user-avatar-small">
                            {user?.profilePicture ? (
                                <img src={user.profilePicture.startsWith('/uploads') ? `http://localhost:5000${user.profilePicture}` : user.profilePicture} alt={user.name} />
                            ) : (
                                <div className="avatar-placeholder-sidebar">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="user-info-small">
                            <div className="user-name-small">{user?.name || 'User'}</div>
                            <div className="user-email-small">{user?.email || ''}</div>
                        </div>
                    </div>

                    {showUserMenu && (
                        <div className="user-menu-dropdown">
                            <div className="user-menu-header">
                                <div className="user-avatar-menu">
                                    {user?.profilePicture ? (
                                        <img src={user.profilePicture.startsWith('/uploads') ? `http://localhost:5000${user.profilePicture}` : user.profilePicture} alt={user.name} />
                                    ) : (
                                        <div className="avatar-placeholder-menu">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="user-details-menu">
                                    <div className="user-name-menu">{user?.name || 'User'}</div>
                                    <div className="user-email-menu">{user?.email || ''}</div>
                                </div>
                            </div>

                            <div className="user-menu-actions">
                                <button className="menu-action-item" onClick={() => {
                                    setShowUserMenu(false);
                                    setShowManageAccount(true);
                                }}>
                                    <span className="menu-icon">⚙️</span>
                                    <span>Manage account</span>
                                </button>
                                <button className="menu-action-item" onClick={() => {
                                    setShowUserMenu(false);
                                    setShowQRModal(true);
                                }}>
                                    <span className="menu-icon">📱</span>
                                    <span>My QR Code</span>
                                </button>
                                <button className="menu-action-item" onClick={() => {
                                    setShowUserMenu(false);
                                    setShowQRScanner(true);
                                }}>
                                    <span className="menu-icon">📷</span>
                                    <span>Scan QR Code</span>
                                </button>
                                <div className="menu-action-item theme-toggle-menu">
                                    <span className="menu-icon">🌙</span>
                                    <span>Dark Mode</span>
                                    <label className="toggle-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={theme === 'dark'}
                                            onChange={() => {
                                                const newTheme = theme === 'light' ? 'dark' : 'light';
                                                setTheme(newTheme);
                                                localStorage.setItem('theme', newTheme);
                                                document.documentElement.setAttribute('data-theme', newTheme);
                                            }}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <button className="menu-action-item" onClick={handleSignOut}>
                                    <span className="menu-icon">🚪</span>
                                    <span>Sign out</span>
                                </button>
                            </div>

                            <div className="add-account-section">
                                <button className="add-account-btn" onClick={() => {
                                    setShowUserMenu(false);
                                    history.push('/');
                                }}>
                                    <div className="add-account-icon">+</div>
                                    <span>Add account</span>
                                </button>
                            </div>

                            <div className="menu-footer">
                                <div className="clerk-badge">
                                    Secured by <strong>clerk</strong>
                                </div>
                                <div className="dev-mode-badge">Development mode</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ManageAccount 
                isOpen={showManageAccount} 
                onClose={() => setShowManageAccount(false)} 
            />

            <QRCodeModal 
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                user={user}
            />

            <QRScanner 
                isOpen={showQRScanner}
                onClose={() => setShowQRScanner(false)}
            />
        </div>
    );
};

export default Sidebar;