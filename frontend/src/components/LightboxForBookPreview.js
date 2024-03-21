// LightboxForBookPreview.js

import React from 'react';
import '../App.css';

function LightboxForBookPreview({ isOpen, onClose, contentRef }) {
    if (!isOpen) return null;

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-close-for-book-preview" onClick={onClose}><i class="fa-solid fa-xmark"></i></div>
            <div className="lightbox-content-for-book-preview" ref={contentRef} style={{ width: '100vw', height: '100vh' }} onClick={(e) => e.stopPropagation()}>
                {/* The content will be handled by the Google Books viewer which attaches to contentRef */}
            </div>
        </div>
    );
}

export default LightboxForBookPreview;