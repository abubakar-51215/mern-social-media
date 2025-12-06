import React, { useState, useEffect } from 'react';
import './Toast.css';

let toastId = 0;
const toastSubscribers = [];

export const toast = {
  success: (message, options = {}) => {
    showToast(message, 'success', options);
  },
  error: (message, options = {}) => {
    showToast(message, 'error', options);
  },
  info: (message, options = {}) => {
    showToast(message, 'info', options);
  },
  confirm: (message, options = {}) => {
    showToast(message, 'confirm', options);
  }
};

function showToast(message, type, options) {
  const id = toastId++;
  const toast = {
    id,
    message,
    type,
    autoClose: type === 'confirm' ? false : (options.autoClose !== undefined ? options.autoClose : 3000),
    onConfirm: options.onConfirm,
    onCancel: options.onCancel,
    confirmText: options.confirmText || 'Delete',
    cancelText: options.cancelText || 'Cancel'
  };
  
  toastSubscribers.forEach(callback => callback(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (toast) => {
      setToasts(prev => [...prev, toast]);
      
      if (toast.autoClose) {
        setTimeout(() => {
          removeToast(toast.id);
        }, toast.autoClose);
      }
    };

    toastSubscribers.push(handleToast);

    return () => {
      const index = toastSubscribers.indexOf(handleToast);
      if (index > -1) {
        toastSubscribers.splice(index, 1);
      }
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleConfirm = (toastItem) => {
    if (toastItem.onConfirm) {
      toastItem.onConfirm();
    }
    removeToast(toastItem.id);
  };

  const handleCancel = (toastItem) => {
    if (toastItem.onCancel) {
      toastItem.onCancel();
    }
    removeToast(toastItem.id);
  };

  return (
    <div className="toast-container">
      {toasts.map(toastItem => (
        <div
          key={toastItem.id}
          className={`toast toast-${toastItem.type}`}
        >
          {toastItem.type !== 'confirm' && (
            <div className="toast-icon">
              {toastItem.type === 'success' && '✓'}
              {toastItem.type === 'error' && '✕'}
              {toastItem.type === 'info' && 'ℹ'}
            </div>
          )}
          <div className="toast-message">{toastItem.message}</div>
          {toastItem.type === 'confirm' ? (
            <div className="toast-actions">
              <button className="toast-btn toast-btn-cancel" onClick={() => handleCancel(toastItem)}>
                {toastItem.cancelText}
              </button>
              <button className="toast-btn toast-btn-confirm" onClick={() => handleConfirm(toastItem)}>
                {toastItem.confirmText}
              </button>
            </div>
          ) : (
            <button className="toast-close" onClick={() => removeToast(toastItem.id)}>
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
