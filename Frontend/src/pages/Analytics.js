import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  getPlatformStats,
  getNewUsersPerDay,
  getNewPostsPerDay,
  getRetentionRate,
  getMostActiveUsers,
  getMostLikedPosts,
  getMostReportedPosts
} from '../api';
import './Analytics.css';

const Analytics = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [usersPerDay, setUsersPerDay] = useState([]);
  const [postsPerDay, setPostsPerDay] = useState([]);
  const [retention, setRetention] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [reportedPosts, setReportedPosts] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, postsRes, retentionRes, activeRes, likedRes, reportedRes] = await Promise.all([
        getPlatformStats(),
        getNewUsersPerDay(),
        getNewPostsPerDay(),
        getRetentionRate(),
        getMostActiveUsers(10),
        getMostLikedPosts(10),
        getMostReportedPosts(10)
      ]);

      setStats(statsRes.data);
      setUsersPerDay(usersRes.data.data || []);
      setPostsPerDay(postsRes.data.data || []);
      setRetention(retentionRes.data);
      setActiveUsers(activeRes.data.data || []);
      setLikedPosts(likedRes.data.data || []);
      setReportedPosts(reportedRes.data.data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, label, value, subtext, color }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
    </div>
  );

  const ChartTable = ({ title, data, columns }) => (
    <div className="chart-section">
      <h3>{title}</h3>
      <div className="data-table">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : row[col.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', color: '#9ca3af' }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <button className="back-link" onClick={() => history.push('/admin/dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="analytics-title">
          <h1>📊 Analytics & Platform Insights</h1>
          <p>Monitor your platform's performance and user engagement</p>
        </div>
      </div>

      {/* Platform Overview Stats */}
      <div className="stats-overview">
        <StatCard
          icon="👥"
          label="Total Users"
          value={stats?.totalUsers || 0}
          color="blue"
        />
        <StatCard
          icon="📝"
          label="Total Posts"
          value={stats?.totalPosts || 0}
          color="purple"
        />
        <StatCard
          icon="🚩"
          label="Total Reports"
          value={stats?.totalReports || 0}
          color="red"
        />
        <StatCard
          icon="📈"
          label="Retention Rate"
          value={`${retention?.retentionRate || 0}%`}
          subtext={`${retention?.activeUsersThisWeek || 0} active this week`}
          color="green"
        />
      </div>

      {/* Weekly Stats */}
      <div className="weekly-stats">
        <StatCard
          icon="➕"
          label="New Users (This Week)"
          value={stats?.newUsersThisWeek || 0}
          color="blue-light"
        />
        <StatCard
          icon="✍️"
          label="New Posts (This Week)"
          value={stats?.newPostsThisWeek || 0}
          color="purple-light"
        />
        <StatCard
          icon="🟢"
          label="Active Users (This Week)"
          value={stats?.activeUsersThisWeek || 0}
          color="green-light"
        />
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <ChartTable
          title="📅 New Users Per Day (Last 7 Days)"
          data={usersPerDay}
          columns={[
            { key: '_id', label: 'Date' },
            { key: 'count', label: 'New Users' }
          ]}
        />

        <ChartTable
          title="📝 New Posts Per Day (Last 7 Days)"
          data={postsPerDay}
          columns={[
            { key: '_id', label: 'Date' },
            { key: 'count', label: 'New Posts' }
          ]}
        />
      </div>

      {/* Top Content Section */}
      <div className="charts-grid">
        <ChartTable
          title="👥 Most Active Users (By Posts)"
          data={activeUsers}
          columns={[
            {
              key: 'name',
              label: 'User',
              render: (row) => (
                <div className="user-cell">
                  <span>{row.name}</span>
                </div>
              )
            },
            { key: 'postCount', label: 'Posts' },
            { key: 'email', label: 'Email' }
          ]}
        />

        <ChartTable
          title="❤️ Most Liked Posts"
          data={likedPosts}
          columns={[
            {
              key: 'content',
              label: 'Post Content',
              render: (row) => (
                <div className="content-cell">
                  {row.post?.content?.substring(0, 50) || '-'}...
                </div>
              )
            },
            { key: 'likeCount', label: 'Likes' },
            {
              key: 'author',
              label: 'Author',
              render: (row) => row.author?.name || 'Unknown'
            }
          ]}
        />
      </div>

      {/* Most Reported Posts */}
      <div className="charts-grid">
        <ChartTable
          title="🚩 Most Reported Posts"
          data={reportedPosts}
          columns={[
            {
              key: 'post',
              label: 'Post Content',
              render: (row) => (
                <div className="content-cell">
                  {row.post?.content?.substring(0, 50) || '-'}...
                </div>
              )
            },
            { key: 'reportCount', label: 'Reports' },
            {
              key: 'author',
              label: 'Author',
              render: (row) => row.author?.name || 'Unknown'
            }
          ]}
        />
      </div>
    </div>
  );
};

export default Analytics;
