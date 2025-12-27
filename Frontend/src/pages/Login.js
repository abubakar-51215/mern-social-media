import React, { useState } from "react";
import API from "../api";
import { setAuth } from "../utils/auth";
import { useHistory } from "react-router-dom";
import "./AuthPage.css";
import "./GoogleAuth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const history = useHistory();

  const submit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", { email, password });
      setAuth(res.data.token, res.data.user);
      history.push("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="auth-page">
      <div className="logo-global">
        <span className="logo-icon">⚡</span>
        <span className="logo-text">pingup</span>
      </div>

      <div className="auth-container">
        <div className="auth-left">
          <div className="testimonial">
            <div className="user-avatars">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="User 1" />
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" alt="User 2" />
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" alt="User 3" />
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
              <h2>Sign in to PingUp</h2>
              <p>Welcome back! Please sign in to continue</p>
            </div>

            <button
                type="button"
                className="google-btn"
                onClick={() => window.location.href = 'https://talhasghar.site/api/auth/google'}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <form onSubmit={submit} className="auth-form">
              <div className="form-group">
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="continue-btn">Sign in →</button>
            </form>

            <div className="auth-switch">
              <p>
                Don't have an account? <button onClick={() => history.push('/signup')} className="link-btn">Sign up</button>
              </p>
            </div>

            <div className="auth-footer">
              <p>Secured by 🔒 clerk</p>
              <p className="dev-mode">Development mode</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
