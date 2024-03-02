import React from 'react';
import '../App.css';

function LightboxForImage({ isOpen, onClose, imageUrl }) {
    if (!isOpen || !imageUrl) return null;

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-close" onClick={onClose}><i class="fa-solid fa-xmark"></i></div>
            <div className="lightbox-content-for-image" onClick={(e) => e.stopPropagation()}>
                <img src={imageUrl} alt="Selected"/>
            </div>
        </div>
    );
}

export default LightboxForImage;
