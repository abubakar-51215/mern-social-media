import React, { useState } from 'react';
import { createReport } from '../api';
import { toast } from './Toast';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose, reportType, itemId, itemName, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonOptions = [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment or Bullying' },
    { value: 'hate_speech', label: 'Hate Speech' },
    { value: 'violence', label: 'Violence or Dangerous Content' },
    { value: 'nudity', label: 'Nudity or Sexual Content' },
    { value: 'misinformation', label: 'False Information' },
    { value: 'copyright', label: 'Copyright Violation' },
    { value: 'self_harm', label: 'Self-Harm or Suicide' },
    { value: 'terrorism', label: 'Terrorism or Extremism' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReport({
        reportType,
        reportedItemId: itemId,
        reason,
        description
      });

      if (typeof onSuccess === 'function') {
        onSuccess();
      } else {
        toast.success('Report submitted successfully');
      }
      onClose();
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      const msg = error.response?.data?.message || 'Please try again';
      if (error.response?.status === 400 && msg.includes('already reported')) {
        toast.error('You have already reported this item.');
      } else {
        toast.error(`Failed to submit report: ${msg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h3>Report {reportType === 'post' ? 'Post' : 'User'}</h3>
          <button className="report-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="report-modal-body">
          <div className="report-item-info">
            <p>You are reporting: <strong>{itemName || 'this item'}</strong></p>
          </div>

          <div className="report-form-group">
            <label>Why are you reporting this?</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} required>
              <option value="">Select a reason...</option>
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="report-form-group">
            <label>Additional details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide any additional information that might help us review this report..."
              rows="4"
            />
          </div>

          <div className="report-modal-footer">
            <button type="button" className="report-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="report-btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
