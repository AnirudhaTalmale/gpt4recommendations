import React, { useState, useEffect, useCallback, useRef } from 'react';
import LightboxForImage from './LightboxForImage';
import LightboxForBookPreview from './LightboxForBookPreview';
import { useParams } from 'react-router-dom';
import socket from './socket';
import Lightbox from './Lightbox';
import { renderStarRating, handleBookPreviewRequest, handleAnecdotesRequest, handleKeyInsightsRequest, handleMoreDetailsRequest, handleQuotesRequest, checkAuthStatus } from './CommonFunctions';
import axios from 'axios';
import ConfirmationDialog from './ConfirmationDialog'; 
import { useGoogleBooksViewer, useStreamChunkHandler } from './CommonHooks'; 


function BookDetails() {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isBookPreviewLightboxOpen, setIsBookPreviewLightboxOpen] = useState(false);
  const [bookIdForPreview, setBookIdForPreview] = useState('');
  const bookPreviewRef = useRef(null);
  const { isViewerLoaded, loadGoogleBooksViewer } = useGoogleBooksViewer(bookPreviewRef);
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxContent, setLightboxContent] = useState('');
  const lightboxContentRef = useRef(null);
  const [isAtBottomLightbox, setIsAtBottomLightbox] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const [isQuotesClicked, setIsQuotesClicked] = useState(false);
  const [isAnecdotesClicked, setIsAnecdotesClicked] = useState(false);
  const [isKeyInsightsClicked, setIsKeyInsightsClicked] = useState(false);
  const [isMoreDetailsClicked, setIsMoreDetailsClicked] = useState(false);

  const handleStopStreaming = useCallback(async () => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/stop-stream`);
      setIsStreaming(false);
      console.log("stream stopped true");
      
    } catch (error) {
      console.error('Error stopping the stream:', error);
    }
  }, []);

  useEffect(() => {
    // Listen for the 'streamEnd' event from the socket
    const handleStreamEnd = ({ message, sessionId }) => {
      if (userData && sessionId === userData.id) {
        setIsStreaming(false);
      }
    };
  
    socket.on('streamEnd', handleStreamEnd);
  
    return () => {
      // Cleanup: remove the listener when the component unmounts
      socket.off('streamEnd', handleStreamEnd);
    };
  }, [userData]);

  useEffect(() => {
    const handleMessageLimitReached = ({ userId: reachedUserId, limitMessage }) => {
      // Check if the message is for the current user
      if (userData && reachedUserId === userData.id) {
        setConfirmationMessage(limitMessage);
        setIsConfirmationDialogOpen(true);
      }
    };

    socket.on('messageLimitReached', handleMessageLimitReached);

    return () => {
      socket.off('messageLimitReached', handleMessageLimitReached);
    };
  }, [userData]); 

  useEffect(() => {
    checkAuthStatus().then((userData) => {
      if (userData) {
        setUserData(userData);
      }
    });
  }, []);

  const isUserAtBottomLightbox = useCallback(() => {
    if (!lightboxContentRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = lightboxContentRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
    return isAtBottom;
  }, []);
  
  const scrollToBottomLightbox = () => {
    if (lightboxContentRef.current) {
      lightboxContentRef.current.scrollTop = lightboxContentRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isAtBottomLightbox) {
      scrollToBottomLightbox();
    }
  }, [lightboxContent, isAtBottomLightbox]);

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
  }, [isLightboxOpen, isUserAtBottomLightbox]);

  useEffect(() => {
    if (isBookPreviewLightboxOpen && bookIdForPreview && isViewerLoaded) {
      loadGoogleBooksViewer(bookIdForPreview);
    }
  }, [isBookPreviewLightboxOpen, bookIdForPreview, isViewerLoaded, loadGoogleBooksViewer]);
  
  const handlePreviewClick = () => {
    if (book) {
      handleBookPreviewRequest(book.isbn, setIsBookPreviewLightboxOpen, setBookIdForPreview, isViewerLoaded);
    }
  };
  
  useStreamChunkHandler(
    socket,
    () => userData?.id, // Getting session ID from userData for BookDetails.js
    handleStopStreaming,
    setLightboxContent,
    setIsStreaming,
    setIsLightboxOpen
  );

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isStreaming) {
        handleStopStreaming();
      }
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isStreaming, handleStopStreaming]);
  

  const handleQuerySubmit = async (query, isMoreDetails = false, isbn = null, bookTitle = null, author = null, moreBooks = false, isKeyInsights = false, isAnecdotes = false, isQuotes = false, isEdit = false) => {
    
    const isFirstQuery = false;
      socket.emit('specific-book-query', {
        userId: userData.id,
        message: {
          role: 'user',
          content: query,
          isFirstQuery
        },
        isMoreDetails,
        isKeyInsights,
        isAnecdotes,
        isQuotes,
        isbn,
        bookTitle,
        author,
        moreBooks,
        isEdit
      });
    
  };

  const fetchBookDetails = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/books/${bookId}`);
      if (!response.ok) throw new Error('Network response was not ok.');
      const data = await response.json();
      setBook(data);
    } catch (error) {
      console.error("Error fetching book details: ", error);
    }
  }, [bookId]); // Dependencies for useCallback, fetchBookDetails gets recreated if bookId changes

  useEffect(() => {
    fetchBookDetails();
  }, [fetchBookDetails]); 

  if (!book) return <div>Loading...</div>;

  // Determine if the preview button should be disabled
  const previewButtonDisabled = !book.embeddable;

  // Function to handle "Buy Now" button click
  const handleBuyNowClick = () => {
    const amazonLink = book.amazonLink || `https://www.amazon.in/s?k=${encodeURIComponent(book.title.trim())}`;
    window.open(amazonLink, '_blank');
  };

  const handleImageClick = () => {
    setLightboxImageUrl(book.bookImage);
    setIsLightboxOpen(true);
  };

  const wrappedHandleQuotesRequest = () => {
    
    if (!isQuotesClicked) {
        setIsQuotesClicked(true);
        
        handleQuotesRequest(
            book.isbn,
            book.title,
            book.author,
            handleQuerySubmit,
            setIsLightboxOpen,
            setLightboxContent
        );

        setTimeout(() => setIsQuotesClicked(false), 3500);
    }
  };

  const wrappedHandleAnecdotesRequest = () => {
    if (!isAnecdotesClicked) {
      setIsAnecdotesClicked(true);
      
      handleAnecdotesRequest(
        book.isbn,
        book.title,
        book.author,
        handleQuerySubmit,
        setIsLightboxOpen,
        setLightboxContent
      );

      setTimeout(() => setIsAnecdotesClicked(false), 3500);
    }
  };

  const wrappedHandleKeyInsightsRequest = () => {
    if (!isKeyInsightsClicked) {
      setIsKeyInsightsClicked(true);
      
      handleKeyInsightsRequest(
        book.isbn,
        book.title,
        book.author,
        handleQuerySubmit,
        setIsLightboxOpen,
        setLightboxContent
      );

      setTimeout(() => setIsKeyInsightsClicked(false), 3500);
    }
  };

  const wrappedHandleMoreDetailsRequest = () => {
    if (!isMoreDetailsClicked) {
      setIsMoreDetailsClicked(true);
      
      handleMoreDetailsRequest(
        book.isbn,
        book.title,
        book.author,
        handleQuerySubmit,
        setIsLightboxOpen,
        setLightboxContent
      );
    
      setTimeout(() => setIsMoreDetailsClicked(false), 3500);
    }
  };

  return (
    <>
      <Lightbox
        isOpen={isLightboxOpen}
        content={lightboxContent}
        onClose={() => {
          setIsLightboxOpen(false);
          setLightboxContent('');
          if (isStreaming) {
            handleStopStreaming();
          }
        }}
        contentRef={lightboxContentRef}
      />
      <LightboxForImage
        isOpen={isLightboxOpen}
        imageUrl={lightboxImageUrl}
        onClose={() => setIsLightboxOpen(false)}
      />
      <LightboxForBookPreview
        isOpen={isBookPreviewLightboxOpen}
        onClose={() => {
          setIsBookPreviewLightboxOpen(false);
          setBookIdForPreview(''); // Reset book ID when closing lightbox
        }}
        contentRef={bookPreviewRef}
      />
      <ConfirmationDialog
        isOpen={isConfirmationDialogOpen}
        onClose={() => setIsConfirmationDialogOpen(false)}
        messageLimitReached={true}
        messageContent={confirmationMessage}
      />
      <div className="book-details-container">
      <div className="book-details-content-wrapper">
        <div className="book-details-image-and-info">
        <div className="book-details-image-container" onClick={handleImageClick}>
            {book.bookImage && <img src={book.bookImage} alt="" />}
        </div>
        <div className="book-details-info">
            <div className="title-book-details">{book.title}</div>
            <div className="author-book-details">by {book.author}</div>
            <div className="ratings-and-review-book-gallery">
                {book.amazonStarRating !== 'Unknown' && (
                    <div className="star-rating-book-gallery">
                    {renderStarRating(book.amazonStarRating)}
                    </div>
                )}
                {book.amazonReviewCount !== 'Unknown' && (
                    <span className="review-count-book-gallery">{book.amazonReviewCount} </span>
                )}
            </div>
        </div>
        </div>
        <div className="book-details-buttons-container">
            <button className="buy-now-button" onClick={handleBuyNowClick}>Buy Now</button>
            <button type="button" className="more-details-btn" onClick={wrappedHandleMoreDetailsRequest}>Book Info</button>
            <button type="button" className="key-insights-btn" onClick={wrappedHandleKeyInsightsRequest}>Insights</button>
            <button type="button" className="anecdotes-btn" onClick={wrappedHandleAnecdotesRequest}>Anecdotes</button>
            <button type="button" className="quotes-btn" onClick={wrappedHandleQuotesRequest}>Quotes</button>
            <button type="button" className="preview-btn" disabled={previewButtonDisabled} onClick={handlePreviewClick}>Preview</button>
        </div>
      </div>
      
    </div>
    </>
  );
}

export default BookDetails;