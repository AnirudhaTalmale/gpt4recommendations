// ConfirmationDialog.jsx
import React from 'react';

const ConfirmationDialog = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
  
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
