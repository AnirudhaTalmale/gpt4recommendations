import React, { useEffect, useRef } from 'react';
import '../App.css';

function LightboxForImage({ isOpen, onClose, imageUrl }) {
    const overlayRef = useRef(null);  // Properly defining the overlayRef
    const contentRef = useRef(null);  // Reference for the image content
    const popStateListenerRef = useRef(null);

    useEffect(() => {
        const disableBodyScroll = () => {
            document.body.style.overflow = 'hidden'; // Disable scrolling on the body
        };

        const enableBodyScroll = () => {
            document.body.style.overflow = ''; // Re-enable scrolling on the body
        };

        const handleScrollEvent = (event) => {
            // This will block the scroll completely, only within the content element
            if (contentRef.current.contains(event.target)) {
                const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
                const isAtTop = scrollTop === 0;
                const isAtBottom = scrollTop + clientHeight >= scrollHeight;

                // Only prevent default if the event is at the boundaries of the content
                if ((isAtTop && event.deltaY < 0) || (isAtBottom && event.deltaY > 0)) {
                    event.preventDefault();
                }
            }
        };

        const handlePopState = () => {
            onClose();
        };

        popStateListenerRef.current = handlePopState;

        const overlay = overlayRef.current;
        if (overlay && isOpen) {
            disableBodyScroll();
            window.history.pushState({ lightbox: true }, ''); // Push a lightbox-specific state
            overlay.addEventListener('wheel', handleScrollEvent, { passive: false });
            overlay.addEventListener('touchmove', handleScrollEvent, { passive: false });
            window.addEventListener('popstate', popStateListenerRef.current);
        }

        return () => {
            enableBodyScroll();
            if (overlay) {
                overlay.removeEventListener('wheel', handleScrollEvent);
                overlay.removeEventListener('touchmove', handleScrollEvent);
            }
            window.removeEventListener('popstate', popStateListenerRef.current);

            if (isOpen) {
                window.history.replaceState(null, '', document.location.pathname); // Replace the current state to clean lightbox-specific state without altering the URL
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen || !imageUrl) return null;

    return (
        <div className="lightbox-overlay" ref={overlayRef} onClick={onClose}>
            <div className="lightbox-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></div>
            <div className="lightbox-content-for-image" ref={contentRef} onClick={(e) => e.stopPropagation()}>
                <img src={imageUrl} alt="Selected"/>
            </div>
        </div>
    );
}

export default LightboxForImage;
