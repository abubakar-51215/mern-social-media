import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  getAllReports, 
  getReportById, 
  updateReportStatus, 
  takeModerationAction,
  getModerationHistory,
  getReportStats
} from '../api';
import { toast } from '../components/Toast';
import './AdminReports.css';

const AdminReports = () => {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState('reports'); // reports, history, stats
  const [reports, setReports] = useState([]);
  const [moderationHistory, setModerationHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Action modal state
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role || user.role !== 'admin') {
      history.push('/dashboard');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'reports') {
          const response = await getAllReports({
            status: statusFilter,
            reportType: typeFilter,
            priority: priorityFilter,
            page: currentPage,
            limit: 20
          });
          setReports(response.data.reports);
          setTotalPages(response.data.totalPages);
        } else if (activeTab === 'history') {
          const response = await getModerationHistory({ page: currentPage, limit: 20 });
          setModerationHistory(response.data.actions);
          setTotalPages(response.data.totalPages);
        } else if (activeTab === 'stats') {
          const response = await getReportStats();
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [history, activeTab, statusFilter, typeFilter, priorityFilter, currentPage]);

  const handleViewReport = async (reportId) => {
    try {
      const response = await getReportById(reportId);
      setSelectedReport(response.data);
    } catch (error) {
      console.error('Error fetching report details:', error);
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      await updateReportStatus(reportId, newStatus);
      // Reload the list
      const response = await getAllReports({
        status: statusFilter,
        reportType: typeFilter,
        priority: priorityFilter,
        page: currentPage,
        limit: 20
      });
      setReports(response.data.reports);
      
      if (selectedReport && selectedReport._id === reportId) {
        handleViewReport(reportId);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update report status: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleTakeAction = async () => {
    if (!selectedReport || !actionType || !actionReason) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await takeModerationAction({
        reportId: selectedReport._id,
        actionType,
        targetType: selectedReport.reportType,
        targetId: selectedReport.reportedItemId,
        reason: actionReason,
        duration: actionDuration || null
      });

      setShowActionModal(false);
      setActionType('');
      setActionReason('');
      setActionDuration('');
      // Reload the list
      const response = await getAllReports({
        status: statusFilter,
        reportType: typeFilter,
        priority: priorityFilter,
        page: currentPage,
        limit: 20
      });
      setReports(response.data.reports);
      handleViewReport(selectedReport._id);
      
      toast.success('Moderation action completed successfully');
    } catch (error) {
      console.error('Error taking action:', error);
      toast.error('Failed to take action: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      critical: '#dc2626',
      high: '#f97316',
      medium: '#eab308',
      low: '#10b981'
    };
    return (
      <span className="priority-badge" style={{ backgroundColor: colors[priority] }}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: '#6b7280',
      under_review: '#3b82f6',
      resolved: '#10b981',
      dismissed: '#94a3b8'
    };
    return (
      <span className="status-badge" style={{ backgroundColor: colors[status] }}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="admin-reports">
      <div className="reports-header">
        <button className="back-link" onClick={() => history.push('/admin/dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="reports-title">
          <h1>Reports & Community Safety</h1>
          <p>Monitor and moderate user reports to maintain community standards</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="reports-tabs">
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => { setActiveTab('reports'); setCurrentPage(1); }}
        >
          📋 Reports
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => { setActiveTab('history'); setCurrentPage(1); }}
        >
          📜 History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="reports-content">
          {/* Filters */}
          <div className="reports-filters">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>

            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Types</option>
              <option value="post">Post Reports</option>
              <option value="user">User Reports</option>
            </select>

            <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button className="refresh-btn" onClick={async () => {
              const response = await getAllReports({
                status: statusFilter,
                reportType: typeFilter,
                priority: priorityFilter,
                page: currentPage,
                limit: 20
              });
              setReports(response.data.reports);
              setTotalPages(response.data.totalPages);
            }}>
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading reports...</p>
            </div>
          ) : (
            <div className="reports-layout">
              {/* Reports List */}
              <div className="reports-list">
                {reports.length === 0 ? (
                  <div className="empty-state">
                    <p>No reports found</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div 
                      key={report._id} 
                      className={`report-card ${selectedReport?._id === report._id ? 'selected' : ''}`}
                      onClick={() => handleViewReport(report._id)}
                    >
                      <div className="report-card-header">
                        <div className="report-meta">
                          <span className="report-type">{report.reportType === 'post' ? '📝' : '👤'} {report.reportType}</span>
                          {getPriorityBadge(report.priority)}
                          {getStatusBadge(report.status)}
                        </div>
                        <span className="report-date">{formatDate(report.createdAt)}</span>
                      </div>
                      <div className="report-card-body">
                        <div className="report-reason">
                          <strong>Reason:</strong> {report.reason.replace('_', ' ')}
                        </div>
                        {report.description && (
                          <div className="report-description">{report.description}</div>
                        )}
                        <div className="report-reporter">
                          Reported by: {report.reporterId?.name || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Report Details */}
              <div className="report-details">
                {selectedReport ? (
                  <>
                    <div className="details-header">
                      <h3>Report Details</h3>
                      <div className="details-meta">
                        {getPriorityBadge(selectedReport.priority)}
                        {getStatusBadge(selectedReport.status)}
                      </div>
                    </div>

                    <div className="details-section">
                      <h4>Report Information</h4>
                      <div className="details-row">
                        <span className="label">Type:</span>
                        <span className="value">{selectedReport.reportType}</span>
                      </div>
                      <div className="details-row">
                        <span className="label">Reason:</span>
                        <span className="value">{selectedReport.reason.replace('_', ' ')}</span>
                      </div>
                      <div className="details-row">
                        <span className="label">Description:</span>
                        <span className="value">{selectedReport.description || 'N/A'}</span>
                      </div>
                      <div className="details-row">
                        <span className="label">Created:</span>
                        <span className="value">{formatDate(selectedReport.createdAt)}</span>
                      </div>
                    </div>

                    <div className="details-section">
                      <h4>Reporter</h4>
                      <div className="user-info">
                        {selectedReport.reporterId?.profilePicture ? (
                          <img 
                            src={selectedReport.reporterId.profilePicture.startsWith('http') ? selectedReport.reporterId.profilePicture : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${selectedReport.reporterId.profilePicture}`}
                            alt={selectedReport.reporterId?.name}
                            className="user-avatar"
                            onError={(e) => e.target.src = '/default-avatar.png'}
                          />
                        ) : (
                          <div className="user-avatar-placeholder">
                            {selectedReport.reporterId?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="user-name">{selectedReport.reporterId?.name}</div>
                          <div className="user-email">{selectedReport.reporterId?.email}</div>
                        </div>
                      </div>
                    </div>

                    {selectedReport.reportedItem && (
                      <div className="details-section">
                        <h4>Reported {selectedReport.reportType === 'post' ? 'Post' : 'User'}</h4>
                        {selectedReport.reportType === 'post' ? (
                          <div className="reported-post">
                            <div className="post-author">
                              By: {selectedReport.reportedItem.user?.name}
                            </div>
                            <div className="post-content">
                              {selectedReport.reportedItem.content}
                            </div>
                            {selectedReport.reportedItem.media && selectedReport.reportedItem.media.length > 0 && (
                              <div className="post-media">
                                {selectedReport.reportedItem.media[0].type === 'image' && (
                                  <img src={selectedReport.reportedItem.media[0].url} alt="Post media" />
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="user-info">
                            <img 
                              src={selectedReport.reportedItem.profilePicture ? (selectedReport.reportedItem.profilePicture.startsWith('http') ? selectedReport.reportedItem.profilePicture : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${selectedReport.reportedItem.profilePicture}`) : '/default-avatar.png'} 
                              alt={selectedReport.reportedItem.name}
                              className="user-avatar"
                              onError={(e) => e.target.src = '/default-avatar.png'}
                            />
                            <div>
                              <div className="user-name">{selectedReport.reportedItem.name}</div>
                              <div className="user-email">{selectedReport.reportedItem.email}</div>
                              <div className="user-status">
                                Status: {selectedReport.reportedItem.isActive ? '✅ Active' : '🚫 Inactive'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedReport.reviewedBy && (
                      <div className="details-section">
                        <h4>Review Information</h4>
                        <div className="details-row">
                          <span className="label">Reviewed By:</span>
                          <span className="value">{selectedReport.reviewedBy.name}</span>
                        </div>
                        <div className="details-row">
                          <span className="label">Reviewed At:</span>
                          <span className="value">{formatDate(selectedReport.reviewedAt)}</span>
                        </div>
                        {selectedReport.resolution && (
                          <div className="details-row">
                            <span className="label">Resolution:</span>
                            <span className="value">{selectedReport.resolution}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Moderation Actions */}
                    {selectedReport.moderationActions && selectedReport.moderationActions.length > 0 && (
                      <div className="details-section">
                        <h4>Moderation Actions Taken</h4>
                        <div className="actions-list">
                          {selectedReport.moderationActions.map((action) => (
                            <div key={action._id} className="action-item">
                              <div className="action-type">{action.actionType.replace('_', ' ').toUpperCase()}</div>
                              <div className="action-reason">{action.reason}</div>
                              <div className="action-meta">
                                By {action.moderatorId?.name} • {formatDate(action.createdAt)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="details-actions">
                      {selectedReport.status === 'pending' && (
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleUpdateStatus(selectedReport._id, 'under_review')}
                        >
                          Start Review
                        </button>
                      )}
                      
                      {['pending', 'under_review'].includes(selectedReport.status) && (
                        <>
                          <button 
                            className="btn btn-danger"
                            onClick={() => setShowActionModal(true)}
                          >
                            Take Action
                          </button>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => handleUpdateStatus(selectedReport._id, 'dismissed')}
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="empty-selection">
                    <p>Select a report to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading history...</p>
            </div>
          ) : (
            <>
              <div className="history-list">
                {moderationHistory.map((action) => (
                  <div key={action._id} className="history-card">
                    <div className="history-header">
                      <span className="action-type-badge">{action.actionType.replace('_', ' ').toUpperCase()}</span>
                      <span className="history-date">{formatDate(action.createdAt)}</span>
                    </div>
                    <div className="history-body">
                      <div className="history-reason"><strong>Reason:</strong> {action.reason}</div>
                      <div className="history-moderator"><strong>By:</strong> {action.moderatorId?.name || 'Admin'}</div>
                      {action.duration && (
                        <div className="history-duration"><strong>Duration:</strong> {action.duration} days</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="stats-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalReports}</div>
                <div className="stat-label">Total Reports</div>
              </div>
            </div>

            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <div className="stat-value">{stats.pendingReports}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>

            <div className="stat-card review">
              <div className="stat-icon">👁️</div>
              <div className="stat-info">
                <div className="stat-value">{stats.underReviewReports}</div>
                <div className="stat-label">Under Review</div>
              </div>
            </div>

            <div className="stat-card resolved">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <div className="stat-value">{stats.resolvedReports}</div>
                <div className="stat-label">Resolved</div>
              </div>
            </div>

            <div className="stat-card dismissed">
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <div className="stat-value">{stats.dismissedReports}</div>
                <div className="stat-label">Dismissed</div>
              </div>
            </div>

            <div className="stat-card post-reports">
              <div className="stat-icon">📝</div>
              <div className="stat-info">
                <div className="stat-value">{stats.postReports}</div>
                <div className="stat-label">Post Reports</div>
              </div>
            </div>

            <div className="stat-card user-reports">
              <div className="stat-icon">👤</div>
              <div className="stat-info">
                <div className="stat-value">{stats.userReports}</div>
                <div className="stat-label">User Reports</div>
              </div>
            </div>

            <div className="stat-card critical">
              <div className="stat-icon">🚨</div>
              <div className="stat-info">
                <div className="stat-value">{stats.criticalReports}</div>
                <div className="stat-label">Critical (Pending)</div>
              </div>
            </div>

            <div className="stat-card high">
              <div className="stat-icon">⚠️</div>
              <div className="stat-info">
                <div className="stat-value">{stats.highPriorityReports}</div>
                <div className="stat-label">High Priority (Pending)</div>
              </div>
            </div>

            <div className="stat-card recent">
              <div className="stat-icon">🕐</div>
              <div className="stat-info">
                <div className="stat-value">{stats.reportsLast24h}</div>
                <div className="stat-label">Last 24 Hours</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Take Moderation Action</h3>
              <button className="close-btn" onClick={() => setShowActionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Action Type</label>
                <select value={actionType} onChange={(e) => setActionType(e.target.value)}>
                  <option value="">Select action...</option>
                  {selectedReport?.reportType === 'post' && (
                    <>
                      <option value="delete_post">Delete Post</option>
                      <option value="remove_content">Remove Content</option>
                    </>
                  )}
                  {selectedReport?.reportType === 'user' && (
                    <>
                      <option value="warn_user">Warn User</option>
                      <option value="suspend_user">Suspend User</option>
                      <option value="ban_user">Ban User</option>
                      <option value="restrict_posting">Restrict Posting</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Reason (required)</label>
                <textarea 
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Explain why this action is being taken..."
                  rows="4"
                />
              </div>

              {['suspend_user', 'restrict_posting'].includes(actionType) && (
                <div className="form-group">
                  <label>Duration (days)</label>
                  <input 
                    type="number"
                    value={actionDuration}
                    onChange={(e) => setActionDuration(e.target.value)}
                    placeholder="e.g., 7"
                    min="1"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowActionModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleTakeAction}>
                Take Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
