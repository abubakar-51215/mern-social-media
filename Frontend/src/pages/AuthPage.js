import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { loginUser, registerUser, getPublicPlatformSettings } from '../api';
import { setAuth } from '../utils/auth';
import './AuthPage.css';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [platformInfo, setPlatformInfo] = useState({
        platformName: 'MERN Social Media',
        platformDescription: 'Connect, Share, and Build Relationships'
    });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState('email'); // 'email', 'otp', 'reset'
    const [forgotEmail, setForgotEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const history = useHistory();

    useEffect(() => {
        // Fetch platform settings
        const fetchPlatformInfo = async () => {
            try {
                const response = await getPublicPlatformSettings();
                if (response.data) {
                    setPlatformInfo({
                        platformName: response.data.platformName || 'MERN Social Media',
                        platformDescription: response.data.platformDescription || 'Connect, Share, and Build Relationships'
                    });
                }
            } catch (error) {
                console.error('Error fetching platform info:', error);
                // Use default values if fetch fails
            }
        };

        fetchPlatformInfo();

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const user = urlParams.get('user');
        const error = urlParams.get('error');

        if (error) {
            setError('Google authentication failed');
        } else if (token && user) {
            const userData = JSON.parse(decodeURIComponent(user));
            setAuth(token, userData);
            history.push('/dashboard');
        }
    }, [history]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        // Validate passwords match for signup
        if (!isLogin) {
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters long');
                return;
            }
        }
        
        try {
            let result;
            if (isLogin) {
                // Hardcoded Admin Credentials Check
                const ADMIN_EMAIL = 'admin@pingup.com';
                const ADMIN_PASSWORD = 'Admin@123';
                
                // Trim the input values
                const enteredEmail = formData.email.trim().toLowerCase();
                const enteredPassword = formData.password.trim();
                
                console.log('Login attempt:', { enteredEmail, passwordLength: enteredPassword.length });
                console.log('Comparing with admin:', { ADMIN_EMAIL, ADMIN_PASSWORD });
                console.log('Email match:', enteredEmail === ADMIN_EMAIL.toLowerCase());
                console.log('Password match:', enteredPassword === ADMIN_PASSWORD);
                
                if (enteredEmail === ADMIN_EMAIL.toLowerCase() && enteredPassword === ADMIN_PASSWORD) {
                    console.log('Admin login detected');
                    // Admin login
                    const adminUser = {
                        _id: 'admin-001',
                        name: 'Administrator',
                        email: ADMIN_EMAIL,
                        role: 'admin'
                    };
                    const adminToken = 'admin-token-' + Date.now();
                    setAuth(adminToken, adminUser);
                    console.log('Admin auth set, redirecting to /admin/dashboard');
                    setTimeout(() => {
                        history.push('/admin/dashboard');
                    }, 100);
                    return;
                } else {
                    // Regular user login
                    result = await loginUser({ email: formData.email, password: formData.password });
                    const { token, user } = result.data || {};
                    if (!token || !user) {
                        throw new Error('Login response missing token/user');
                    }
                    setAuth(token, user);
                    
                    // Check if user has admin role from backend
                    if (user.role === 'admin') {
                        history.push('/admin/dashboard');
                    } else {
                        history.push('/dashboard');
                    }
                }
            } else {
                result = await registerUser(formData);
                setSuccess('Account created successfully! Please login.');
                setIsLogin(true);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
            }
        } catch (error) {
            console.error('Auth error:', error);
            setError(error.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div className="auth-page">
            {/* Global top-left logo */}
            <div className="logo-global">
                <div className="logo-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="boltGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style={{stopColor: '#fda746', stopOpacity: 1}} />
                                <stop offset="100%" style={{stopColor: '#f66c47', stopOpacity: 1}} />
                            </linearGradient>
                        </defs>
                        <path d="M10.5 2L4 10h5l-1 6 6.5-8h-5l1-6z" fill="url(#boltGradient)"/>
                    </svg>
                </div>
                <span className="logo-text">pingup</span>
            </div>

            <div className="auth-container">
                <div className="auth-left">
                    
                    
<div className="testimonial">
    <div className="user-avatars">
        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="User 1" />
        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" alt="User 3" />
        <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" alt="User 4" />
    </div>
    <div className="testimonial-info">
        <div className="stars">⭐⭐⭐⭐⭐</div>
        <p className="testimonial-text">Used by 12k+ developers</p>
    </div>
</div>


                    <div className="hero-content">
                        <h1>
                            <span className="hero-line1">More than just friends</span>
                            <span className="hero-line2">truly connect</span>
                        </h1>
                        <p>connect with global community on pingup.</p>
                    </div>
                </div>

                <div className="auth-right">
                    <div className="auth-form-container">
                        <div className="auth-header">
                            <h2>{isLogin ? `Sign in to ${platformInfo.platformName}` : 'Create your account'}</h2>
                            <p>{isLogin ? 'Welcome back! Please sign in to continue' : platformInfo.platformDescription}</p>
                        </div>

                        <button className="google-btn" onClick={() => window.location.href = 'https://talhasghar.site/api/auth/google'}>
                            <img src={`${process.env.PUBLIC_URL}/google_logo.webp`} alt="Google" className="google-icon" width="18" height="18" />
                            <span>Continue with Google</span>
                        </button>

                        <div className="divider">
                            <span>or</span>
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="success-message">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            {!isLogin && (
                                <div className="form-group">
                                    <label>Full name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required={!isLogin}
                                    />
                                </div>
                            )}
                            
                            <div className="form-group">
                                <label>Email address</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            {!isLogin && (
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            placeholder="Confirm your password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required={!isLogin}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isLogin && (
                                <div className="forgot-password-link">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="link-btn"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            <button type="submit" className="continue-btn">
                                {isLogin ? 'Sign in →' : 'Register →'}
                            </button>
                        </form>

                        <div className="auth-switch">
                            {isLogin ? (
                                <p>Don't have an account? <button onClick={() => setIsLogin(false)} className="link-btn">Sign up</button></p>
                            ) : (
                                <p>Already have an account? <button onClick={() => setIsLogin(true)} className="link-btn">Sign in</button></p>
                            )}
                        </div>

                        <div className="auth-footer">
                            <p>Secured by 🔒 clerk</p>
                            <p className="dev-mode">Development mode</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="forgot-password-modal-overlay" onClick={() => setShowForgotPassword(false)}>
                    <div className="forgot-password-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowForgotPassword(false)}>×</button>
                        
                        {forgotPasswordStep === 'email' && (
                            <>
                                <h3>Forgot Password</h3>
                                <p>Enter your email address and we'll send you an OTP to reset your password.</p>
                                <div className="form-group">
                                    <label>Email address</label>
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                    />
                                </div>
                                <button
                                    className="continue-btn"
                                    onClick={async () => {
                                        if (!forgotEmail || !forgotEmail.trim()) {
                                            alert('Please enter an email to send an OTP');
                                            return;
                                        }
                                        
                                        try {
                                            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email: forgotEmail })
                                            });
                                            const data = await response.json();
                                            if (response.ok) {
                                                alert('OTP sent to your email!');
                                                setForgotPasswordStep('otp');
                                            } else {
                                                alert(data.message || 'Failed to send OTP');
                                            }
                                        } catch (error) {
                                            alert('Error sending OTP');
                                        }
                                    }}
                                >
                                    Send OTP
                                </button>
                            </>
                        )}

                        {forgotPasswordStep === 'otp' && (
                            <>
                                <h3>Enter OTP</h3>
                                <p>We've sent a 6-digit code to {forgotEmail}</p>
                                <div className="form-group">
                                    <label>OTP Code</label>
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength="6"
                                    />
                                </div>
                                <button
                                    className="continue-btn"
                                    onClick={async () => {
                                        try {
                                            const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email: forgotEmail, otp })
                                            });
                                            const data = await response.json();
                                            if (response.ok) {
                                                setForgotPasswordStep('reset');
                                            } else {
                                                alert(data.message || 'Invalid OTP');
                                            }
                                        } catch (error) {
                                            alert('Error verifying OTP');
                                        }
                                    }}
                                >
                                    Verify OTP
                                </button>
                                <button
                                    className="link-btn"
                                    style={{ marginTop: '10px', width: '100%', textAlign: 'center' }}
                                    onClick={() => setForgotPasswordStep('email')}
                                >
                                    Resend OTP
                                </button>
                            </>
                        )}

                        {forgotPasswordStep === 'reset' && (
                            <>
                                <h3>Reset Password</h3>
                                <p>Enter your new password</p>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    className="continue-btn"
                                    onClick={async () => {
                                        try {
                                            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email: forgotEmail, otp, newPassword })
                                            });
                                            const data = await response.json();
                                            if (response.ok) {
                                                alert('Password reset successfully!');
                                                setShowForgotPassword(false);
                                                setForgotPasswordStep('email');
                                                setForgotEmail('');
                                                setOtp('');
                                                setNewPassword('');
                                            } else {
                                                alert(data.message || 'Failed to reset password');
                                            }
                                        } catch (error) {
                                            alert('Error resetting password');
                                        }
                                    }}
                                >
                                    Reset Password
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;
