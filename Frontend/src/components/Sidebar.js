import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useHistory } from 'react-router-dom';
import { getSocket } from '../socket';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import PeopleIcon from '@mui/icons-material/People';
import ExploreIcon from '@mui/icons-material/Explore';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import CreateIcon from '@mui/icons-material/Create';
import BoltIcon from '@mui/icons-material/Bolt';
import LogoutIcon from '@mui/icons-material/Logout';
import QrCodeIcon from '@mui/icons-material/QrCode';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import './Sidebar.css';
import ManageAccount from './ManageAccount';
import QRCodeModal from './QRCodeModal';
import QRScanner from './QRScanner';

const Sidebar = ({ isOpen = false, onClose }) => {
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
    const locationRef = useRef(location.pathname);

    useEffect(() => {
        locationRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        currentUserRef.current = userData;
        setUser(userData);

        // Initialize theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Initialize Socket.io connection (shared singleton)
        socketRef.current = getSocket();
        if (userData?._id) {
            socketRef.current.emit('join', userData._id);
        }

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
        const handleReceiveMessage = () => {
            // Increment unread count if not on messages page
            if (locationRef.current !== '/messages') {
                setUnreadMessages(prev => prev + 1);
            }
        };
        socketRef.current.on('receiveMessage', handleReceiveMessage);

        // Listen for friend request events
        const handleFriendRequestReceived = () => {
            setFriendRequests(prev => prev + 1);
        };
        socketRef.current.on('friendRequestReceived', handleFriendRequestReceived);

        const handleFriendRequestAccepted = () => {
            // Optionally show a notification
        };
        socketRef.current.on('friendRequestAccepted', handleFriendRequestAccepted);

        // Listen for new notifications (likes, comments, follows)
        const handleNewNotification = () => {
            // Trigger notification refresh or show toast
        };
        socketRef.current.on('newNotification', handleNewNotification);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('receiveMessage', handleReceiveMessage);
                socketRef.current.off('friendRequestReceived', handleFriendRequestReceived);
                socketRef.current.off('friendRequestAccepted', handleFriendRequestAccepted);
                socketRef.current.off('newNotification', handleNewNotification);
            }
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close sidebar when route changes (useful on mobile)
    useEffect(() => {
        if (onClose) onClose();
    }, [location.pathname]);

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
        { path: '/dashboard', icon: <HomeIcon />, label: 'Feed', badge: null },
        { path: '/messages', icon: <ChatIcon />, label: 'Messages', badge: unreadMessages },
        { path: '/connections', icon: <PeopleIcon />, label: 'Connections', badge: friendRequests },
        { path: '/discover', icon: <ExploreIcon />, label: 'Discover', badge: null },
        { path: '/profile', icon: <PersonIcon />, label: 'Profile', badge: null },
        { path: '/settings', icon: <SettingsIcon />, label: 'Settings', badge: null },
        { path: '/create-post', icon: <CreateIcon />, label: 'Create Post', badge: null, isButton: true }
    ];

    return (
        <div className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                <Link to="/dashboard" className="logo">
                    <span className="logo-icon"><BoltIcon /></span>
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
                                    <span className="menu-icon"><SettingsIcon fontSize="small" /></span>
                                    <span>Manage account</span>
                                </button>
                                <button className="menu-action-item" onClick={() => {
                                    setShowUserMenu(false);
                                    setShowQRModal(true);
                                }}>
                                    <span className="menu-icon"><QrCodeIcon fontSize="small" /></span>
                                    <span>My QR Code</span>
                                </button>
                                <button className="menu-action-item" onClick={() => {
                                    setShowUserMenu(false);
                                    setShowQRScanner(true);
                                }}>
                                    <span className="menu-icon"><QrCodeScannerIcon fontSize="small" /></span>
                                    <span>Scan QR Code</span>
                                </button>
                                <div className="menu-action-item theme-toggle-menu">
                                    <span className="menu-icon">{theme === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}</span>
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
                                    <span className="menu-icon"><LogoutIcon fontSize="small" /></span>
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