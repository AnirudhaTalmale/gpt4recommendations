import React, { useEffect, useRef } from 'react';
import '../App.css';

function Lightbox({ isOpen, content, onClose, contentRef }) {
    const firstRender = useRef(true);

    useEffect(() => {
        const disableBodyScroll = () => {
            document.body.style.overflow = 'hidden';
        };

        const enableBodyScroll = () => {
            document.body.style.overflow = '';
        };

        const handleScrollEvent = (event) => {
            // This will block the scroll completely, only within the content element
            if (contentRef.current.contains(event.target)) {
                const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
                const isAtTop = scrollTop === 0;
                const isAtBottom = scrollTop + clientHeight >= scrollHeight;

                if ((isAtTop && event.deltaY < 0) || (isAtBottom && event.deltaY > 0)) {
                    event.preventDefault();
                }
            }
        };

        if (isOpen) {
            disableBodyScroll();
            // Scroll to the top every time the modal opens
            setTimeout(() => {
                if (!firstRender.current && contentRef.current) {
                    contentRef.current.scrollTop = 0;
                }
            }, 10);
            firstRender.current = false;
            document.addEventListener('wheel', handleScrollEvent, { passive: false });
            document.addEventListener('touchmove', handleScrollEvent, { passive: false });
        }

        return () => {
            enableBodyScroll();
            document.removeEventListener('wheel', handleScrollEvent);
            document.removeEventListener('touchmove', handleScrollEvent);
        };
    }, [isOpen, contentRef]);

    if (!isOpen) return null;

    const hasContent = content !== undefined && content !== null;

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></div>
            <div className="lightbox-content" ref={contentRef} onClick={(e) => e.stopPropagation()}>
                {hasContent ? (
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                ) : null}
            </div>
        </div>
    );
}

export default Lightbox;
