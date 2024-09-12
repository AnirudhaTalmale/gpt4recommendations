import { useState, useEffect, useCallback } from 'react';

export const useStreamChunkHandler = (
  socket, 
  getSessionId, // Function to get the session ID
  handleStopStreaming, 
  setLightboxContent, 
  setIsStreaming, 
  setIsLightboxOpen, 
  additionalElseAction = null // Only action required as per current scenario
) => {
  useEffect(() => {
    let streamTimeout;

    const handleStreamChunk = ({ content, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, moreBooks }) => {
      const currentSessionId = getSessionId();

      if (currentSessionId === sessionId) {
        if (isMoreDetails || isKeyInsights || isAnecdotes || isQuotes) {
          setLightboxContent(prevContent => prevContent + content);
          setIsStreaming(true);
          setIsLightboxOpen(true);
        } else {
          // Execute the additional action in the else condition
          if (additionalElseAction) {
            additionalElseAction(content, moreBooks);
          }
        }
  
        clearTimeout(streamTimeout);
        streamTimeout = setTimeout(() => {
          handleStopStreaming();
        }, 7000);
      }
    };

    socket.on('chunk', handleStreamChunk);

    return () => {
      socket.off('chunk', handleStreamChunk);
      clearTimeout(streamTimeout);
    };
  }, [
    getSessionId,
    handleStopStreaming, 
    setLightboxContent, 
    setIsStreaming, 
    setIsLightboxOpen, 
    additionalElseAction,
    socket,
  ]);
};

export const useHandleStreamEnd = (
  socket,
  getSessionId, // Function to get the session ID or User ID
  onStreamEnd // Callback function to execute when the stream ends
) => {
  useEffect(() => {
    const handleStreamEnd = ({ sessionId }) => {
      const sessionIdOrUserId = getSessionId();

      // Check if the current session or user ID matches the one from the event
      if (sessionIdOrUserId === sessionId) {
        onStreamEnd();
      }
    };

    // Listen for the 'streamEnd' event
    socket.on('streamEnd', handleStreamEnd);

    // Cleanup: remove the listener when the component unmounts
    return () => {
      socket.off('streamEnd', handleStreamEnd);
    };
  }, [getSessionId, onStreamEnd, socket]);
};

export const useLightboxScroll = (lightboxContentRef, isLightboxOpen) => {
  const [isAtBottomLightbox, setIsAtBottomLightbox] = useState(false);

  const isUserAtBottomLightbox = useCallback(() => {
    if (!lightboxContentRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = lightboxContentRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
    return isAtBottom;
  }, [lightboxContentRef]);

  const scrollToBottomLightbox = useCallback(() => {
    if (lightboxContentRef.current) {
      lightboxContentRef.current.scrollTop = lightboxContentRef.current.scrollHeight;
    }
  }, [lightboxContentRef]);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtBottomLightbox(isUserAtBottomLightbox());
    };

    const lightboxContentElement = lightboxContentRef.current;

    if (isLightboxOpen && lightboxContentElement) {
      lightboxContentElement.addEventListener('scroll', handleScroll);

      return () => {
        lightboxContentElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isLightboxOpen, lightboxContentRef, isUserAtBottomLightbox]);

  useEffect(() => {
    if (isAtBottomLightbox) {
      scrollToBottomLightbox();
    }
  }, [isAtBottomLightbox, scrollToBottomLightbox]);

  return { scrollToBottomLightbox, isUserAtBottomLightbox, isAtBottomLightbox };
};