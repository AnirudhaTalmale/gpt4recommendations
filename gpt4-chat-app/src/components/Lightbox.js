import React from 'react';
import '../App.css';

function Lightbox({ isOpen, content, onClose, contentRef }) {
    if (!isOpen) return null;
  
    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-close" onClick={onClose}>&times;</div> {/* Moved outside of lightbox-content */}
            <div className="lightbox-content" ref={contentRef} onClick={(e) => e.stopPropagation()}>
                <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
        </div>
    );
}

export default Lightbox;
