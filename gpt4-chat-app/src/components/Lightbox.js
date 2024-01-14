import React from 'react';
import '../App.css';

function Lightbox({ isOpen, content, onClose }) {
    if (!isOpen) return null;
  
    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-close" onClick={onClose}>&times;</div> {/* Moved outside of lightbox-content */}
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
        </div>
    );
    
}

export default Lightbox;
