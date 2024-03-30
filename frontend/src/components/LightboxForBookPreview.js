// LightboxForBookPreview.js

import React, { useEffect } from 'react';
import '../App.css';

function LightboxForBookPreview({ isOpen, onClose, contentRef }) {
    useEffect(() => {
        const handleTouchMove = (e) => {
            e.preventDefault();
        };

        const contentElement = contentRef.current;
        if (contentElement) {
            contentElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        }

        return () => {
            if (contentElement) {
                contentElement.removeEventListener('touchmove', handleTouchMove);
            }
        };
    }, [isOpen, contentRef]);

    if (!isOpen) return null;

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-close-for-book-preview" onClick={onClose}><i class="fa-solid fa-xmark"></i></div>
            <div className="lightbox-content-for-book-preview" ref={contentRef} style={{ width: '100dvw', height: '100dvh' }} onClick={(e) => e.stopPropagation()}>
                {/* The content will be handled by the Google Books viewer which attaches to contentRef */}
            </div>
        </div>
    );
}

export default LightboxForBookPreview;