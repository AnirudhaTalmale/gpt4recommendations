import { useState, useEffect } from 'react';

export const useGoogleBooksViewer = (bookPreviewRef) => {
    const [isViewerLoaded, setIsViewerLoaded] = useState(false);

    useEffect(() => {
        const checkIfGoogleBooksIsLoaded = () => {
        if (window.google && window.google.books) {
            setIsViewerLoaded(true);
        } else {
            console.error("Google Books API is not available.");
        }
        };
        checkIfGoogleBooksIsLoaded();
    }, []);

    const loadGoogleBooksViewer = (bookId) => {
        if (isViewerLoaded && bookPreviewRef.current) {
        var viewer = new window.google.books.DefaultViewer(bookPreviewRef.current);
        viewer.load(`ISBN:${bookId}`, null, function() {
            // Successfully loaded
        }, function() {
            console.error("Google Books could not load the book.");
        });
        }
    };

    return { isViewerLoaded, loadGoogleBooksViewer };
};

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
