import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getAdminStats } from '../api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const history = useHistory();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
    newUsersToday: 0,
    reportsLast24Hours: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    signupsPerWeek: [],
    postsPerDay: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('AdminDashboard - Current user:', user);
    setCurrentUser(user);
    
    if (!user.role || user.role !== 'admin') {
      console.log('Not admin, redirecting to dashboard');
      history.push('/dashboard');
      return;
    }
    
    console.log('Admin user confirmed, loading stats');
    loadStats();
  }, [history]);

  const loadStats = async () => {
    try {
      setRefreshing(true);
      const response = await getAdminStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      try {
        // Optional toast event for global handler
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Stats updated' } }));
      } catch (_) {}
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    history.push('/');
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
              <defs>
                <linearGradient id="adminLogo" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#fda746', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#f66c47', stopOpacity: 1}} />
                </linearGradient>
              </defs>
              <path d="M10.5 2L4 10h5l-1 6 6.5-8h-5l1-6z" fill="url(#adminLogo)"/>
            </svg>
          </div>
          <span>PingUp Admin</span>
        </div>

        <nav className="admin-nav">
          <a href="/admin/dashboard" className="nav-item active">
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a href="/admin/users" className="nav-item">
            <span className="nav-icon">👥</span>
            <span>Users</span>
          </a>
          <a href="/admin/posts" className="nav-item">
            <span className="nav-icon">📝</span>
            <span>Posts</span>
          </a>
          <a href="/admin/reports" className="nav-item">
            <span className="nav-icon">⚠️</span>
            <span>Reports</span>
          </a>
          <a href="/admin/analytics" className="nav-item">
            <span className="nav-icon">📈</span>
            <span>Analytics</span>
          </a>
          <a href="/admin/settings" className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </a>
        </nav>

        <div className="admin-user">
          <div className="admin-user-info">
            <div className="admin-avatar">A</div>
            <div className="admin-details">
              <p className="admin-name">{currentUser?.name || 'Admin'}</p>
              <p className="admin-role">Administrator</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1>Dashboard Overview</h1>
            <p>Welcome back, {currentUser?.name || 'Admin'}! Here's what's happening today.</p>
          </div>
          <button className={`refresh-btn ${refreshing ? 'is-refreshing' : ''}`} onClick={loadStats} disabled={refreshing}>
            <span className="refresh-icon">{refreshing ? '⏳' : '🔄'}</span>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <p className="stat-label">Total Users</p>
              <h2 className="stat-value">{stats.totalUsers.toLocaleString()}</h2>
              <p className="stat-change positive">+{stats.newUsersToday} today</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <p className="stat-label">Total Posts</p>
              <h2 className="stat-value">{stats.totalPosts.toLocaleString()}</h2>
              <p className="stat-change">All time</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <p className="stat-label">Total Comments</p>
              <h2 className="stat-value">{stats.totalComments.toLocaleString()}</h2>
              <p className="stat-change">All time</p>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-icon">❤️</div>
            <div className="stat-content">
              <p className="stat-label">Total Likes</p>
              <h2 className="stat-value">{stats.totalLikes.toLocaleString()}</h2>
              <p className="stat-change">All time</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">🆕</div>
            <div className="stat-content">
              <p className="stat-label">New Users Today</p>
              <h2 className="stat-value">{stats.newUsersToday}</h2>
              <p className="stat-change">Last 24 hours</p>
            </div>
          </div>

          <div className="stat-card alert">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <p className="stat-label">Reports</p>
              <h2 className="stat-value">{stats.reportsLast24Hours}</h2>
              <p className="stat-change negative">Last 24 hours</p>
            </div>
          </div>

          <div className="stat-card active">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <p className="stat-label">Active Users</p>
              <h2 className="stat-value">{stats.activeUsers.toLocaleString()}</h2>
              <p className="stat-change positive">
                {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>

          <div className="stat-card inactive">
            <div className="stat-icon">💤</div>
            <div className="stat-content">
              <p className="stat-label">Inactive Users</p>
              <h2 className="stat-value">{stats.inactiveUsers.toLocaleString()}</h2>
              <p className="stat-change">
                {((stats.inactiveUsers / stats.totalUsers) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
              <h3>New Signups (Last 7 Days)</h3>
              <select className="chart-filter">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <div className="chart-container">
              <div className="bar-chart">
                {stats.signupsPerWeek.map((count, index) => (
                  <div key={index} className="bar-wrapper">
                    <div 
                      className="bar" 
                      style={{ height: `${(count / Math.max(...stats.signupsPerWeek, 1)) * 100}%` }}
                      title={`${count} signups`}
                    >
                      <span className="bar-value">{count}</span>
                    </div>
                    <span className="bar-label">Day {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Posts per Day (Last 7 Days)</h3>
              <select className="chart-filter">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <div className="chart-container">
              <div className="line-chart">
                <svg width="100%" height="200" viewBox="0 0 700 200">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#6366f1', stopOpacity: 0.3}} />
                      <stop offset="100%" style={{stopColor: '#6366f1', stopOpacity: 0}} />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  <line x1="0" y1="50" x2="700" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="100" x2="700" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="150" x2="700" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                  
                  {/* Line path */}
                  <polyline
                    fill="url(#lineGradient)"
                    stroke="#6366f1"
                    strokeWidth="3"
                    points={stats.postsPerDay.map((count, index) => {
                      const x = (index / (stats.postsPerDay.length - 1)) * 700;
                      const y = 180 - ((count / Math.max(...stats.postsPerDay, 1)) * 160);
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  
                  {/* Data points */}
                  {stats.postsPerDay.map((count, index) => {
                    const x = (index / (stats.postsPerDay.length - 1)) * 700;
                    const y = 180 - ((count / Math.max(...stats.postsPerDay, 1)) * 160);
                    return (
                      <circle key={index} cx={x} cy={y} r="4" fill="#6366f1">
                        <title>{count} posts</title>
                      </circle>
                    );
                  })}
                </svg>
                <div className="chart-labels">
                  {stats.postsPerDay.map((_, index) => (
                    <span key={index}>Day {index + 1}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <button className="action-btn" onClick={() => history.push('/admin/users')}>
              <span className="action-icon">👥</span>
              <span className="action-text">Manage Users</span>
            </button>
            <button className="action-btn" onClick={() => history.push('/admin/posts')}>
              <span className="action-icon">📝</span>
              <span className="action-text">Review Posts</span>
            </button>
            <button className="action-btn" onClick={() => history.push('/admin/reports')}>
              <span className="action-icon">⚠️</span>
              <span className="action-text">View Reports</span>
            </button>
            <button className="action-btn" onClick={() => alert('Export feature coming soon!')}>
              <span className="action-icon">📊</span>
              <span className="action-text">Export Data</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
