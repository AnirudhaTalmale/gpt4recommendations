import React from 'react';
import '../App.css';

function Lightbox({ isOpen, content, onClose, contentRef }) {
    if (!isOpen) return null;
  
    const hasContent = content !== undefined && content !== null;

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-close" onClick={onClose}>&times;</div>
            <div className="lightbox-content" ref={contentRef} onClick={(e) => e.stopPropagation()}>
                {/* Conditionally render HTML content if it's provided, otherwise assume content is handled externally */}
                {hasContent ? (
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                ) : null}
            </div>
        </div>
    );
}

export default Lightbox;

