// LightboxForBookPreview.js

import React from 'react';
import '../App.css';

function LightboxForBookPreview({ isOpen, onClose, contentRef }) {
    if (!isOpen) return null;

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-close" onClick={onClose}>&times;</div>
            <div className="lightbox-content" ref={contentRef} style={{ width: '95vw', height: '92vh' }} onClick={(e) => e.stopPropagation()}>
                {/* The content will be handled by the Google Books viewer which attaches to contentRef */}
            </div>
        </div>
    );
}

export default LightboxForBookPreview;
