// ConfirmationDialog.jsx
import React from 'react';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  messageLimitReached = false,
  messageContent = '',
}) => {
  if (!isOpen) return null;

  if (messageLimitReached) {
    return (
      <div className="confirmation-dialog-overlay">
        <div className="confirmation-dialog">
          <p>{messageContent}</p>
          <button onClick={onClose}>Okay</button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-dialog-overlay">
      <div className="confirmation-dialog">
        <p>Are you sure you want to delete your account? This action cannot be undone.</p>
        <button onClick={onConfirm}>Yes</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
