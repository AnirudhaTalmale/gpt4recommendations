import React, { useState, useEffect, useCallback, useRef } from 'react';
import LightboxForImage from './LightboxForImage';
import LightboxForBookPreview from './LightboxForBookPreview';
import { useParams } from 'react-router-dom';
import socket from './socket';
import Lightbox from './Lightbox';
import { handleAnecdotesRequest, handleKeyInsightsRequest, handleMoreDetailsRequest } from './CommonFunctions';
import axios from 'axios';
import ConfirmationDialog from './ConfirmationDialog'; // Import ConfirmationDialog component


function BookDetails() {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);

  const [isBookPreviewLightboxOpen, setIsBookPreviewLightboxOpen] = useState(false);
  const [bookIdForPreview, setBookIdForPreview] = useState('');
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
  const bookPreviewRef = useRef(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxContent, setLightboxContent] = useState('');
  const lightboxContentRef = useRef(null);
  const [isAtBottomLightbox, setIsAtBottomLightbox] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

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


  const checkAuthStatus = useCallback(async () => {
  
    try {

      const authResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/check-auth`, { withCredentials: true });
  
      if (authResponse.status === 200 && authResponse.data.isAuthenticated) {
  
        if (!authResponse.data.onboardingComplete) {
          window.location.href = `${process.env.REACT_APP_FRONTEND_URL}/onboarding`;
          return;
        }
  
        const userInfoResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user-info`, { withCredentials: true });
  
        if (userInfoResponse.status === 200 && userInfoResponse.data.isAuthenticated) {
          const currentUserData = userInfoResponse.data.user;
          setUserData(currentUserData);
        }
      } else {
        console.log("Authentication failed, redirecting to login page");
        localStorage.setItem('queryParams', window.location.search);
        window.location.href = `${process.env.REACT_APP_FRONTEND_URL}/auth/login`;
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      localStorage.setItem('queryParams', window.location.search);
      window.location.href = `${process.env.REACT_APP_FRONTEND_URL}/auth/login`;
    }
  }, [setUserData]);
  
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

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
    const checkIfGoogleBooksIsLoaded = () => {
      // Simply check if the API is available and set isViewerLoaded accordingly
      if (window.google && window.google.books) {
        setIsViewerLoaded(true);
      } else {
        console.error("Google Books API is not available.");
      }
    };
  
    checkIfGoogleBooksIsLoaded();
  }, []);

  useEffect(() => {
    if (isBookPreviewLightboxOpen && bookIdForPreview && isViewerLoaded) {
      loadGoogleBooksViewer(bookIdForPreview);
    }
  }, [isBookPreviewLightboxOpen, bookIdForPreview, isViewerLoaded]);

  const loadGoogleBooksViewer = (bookId) => {
    if (bookPreviewRef.current) {
      var viewer = new window.google.books.DefaultViewer(bookPreviewRef.current);
      viewer.load(`ISBN:${bookId}`, null, function() {
        // This function is called when the book is successfully loaded.
      }, function() {
        // This function is called when there's an error loading the book.
        console.error("Google Books could not load the book.");
      });
    }
  };
  
  const handlePreviewClick = () => {
    if (isViewerLoaded) {
      if (book && book.isbn) { // Check if the book object exists and has an ISBN
        setBookIdForPreview(book.isbn);
        setIsBookPreviewLightboxOpen(true); // Directly open the lightbox here
      } else {
        console.log("ISBN not available for the book");
      }
    }
  };


  useEffect(() => {
    const handleStreamChunk = ({ content }) => {
        setLightboxContent(prevContent => prevContent + content);
        setIsLightboxOpen(true);
    };
  
    socket.on('chunk', handleStreamChunk);
  
    return () => {
      socket.off('chunk', handleStreamChunk);
    };
  }, []);
  

  const handleQuerySubmit = async (query, isMoreDetails = false, isbn = null, bookTitle = null, author = null, moreBooks = false, isKeyInsights = false, isAnecdotes = false, isEdit = false) => {
    
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



  const wrappedHandleAnecdotesRequest = () => {
    handleAnecdotesRequest(
        book.isbn,
      book.title,
      book.author,
      handleQuerySubmit,
      setIsLightboxOpen,
      setLightboxContent
    );
  };

  const wrappedHandleKeyInsightsRequest = () => {
    handleKeyInsightsRequest(
      book.isbn,
      book.title,
      book.author,
      handleQuerySubmit,
      setIsLightboxOpen,
      setLightboxContent
    );
  };

  const wrappedHandleMoreDetailsRequest = () => {
    handleMoreDetailsRequest(
        book.isbn,
        book.title,
        book.author,
      handleQuerySubmit,
      setIsLightboxOpen,
      setLightboxContent
    );
  };

  return (
    <div className="book-details-container">
      <Lightbox
        isOpen={isLightboxOpen}
        content={lightboxContent}
        onClose={() => {
          setIsLightboxOpen(false);
          setLightboxContent(''); // Clear the content when Lightbox is closed
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
      <div className="book-details-content-container">
        <div className="book-details-image-container" onClick={handleImageClick}>
            {book.bookImage && <img src={book.bookImage} alt="" />}
        </div>
        <div className="book-details-buttons-container">
            <button className="buy-now-button" onClick={handleBuyNowClick}>Buy Now</button>
            <button type="button" className="more-details-btn" onClick={wrappedHandleMoreDetailsRequest}>Book Info</button>
            <button type="button" className="key-insights-btn" onClick={wrappedHandleKeyInsightsRequest}>Insights</button>
            <button type="button" className="anecdotes-btn" onClick={wrappedHandleAnecdotesRequest}>Anecdotes</button>
            <button type="button" className="preview-btn" disabled={previewButtonDisabled} onClick={handlePreviewClick}>Preview</button>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={isConfirmationDialogOpen}
        onClose={() => setIsConfirmationDialogOpen(false)}
        messageLimitReached={true}
        messageContent={confirmationMessage}
      />
    </div>
  );
}

export default BookDetails;