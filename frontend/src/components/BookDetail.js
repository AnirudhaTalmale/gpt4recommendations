import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BuyNowButton, PreviewButton, MoreDetailsButton, KeyInsightsButton, AnecdotesButton, QuotesButton } from './CommonFunctions';
import { handleAnecdotesRequest, handleKeyInsightsRequest, handleMoreDetailsRequest, handleQuotesRequest } from './CommonFunctions';
import Lightbox from './Lightbox';
import socket from './socket';
import axios from 'axios';
import { useStreamChunkHandler } from './CommonHooks'; 
import { checkAuthStatus, renderStarRating } from './CommonFunctions';
import BookDetailHeader from './BookDetailHeader'; 
import LightboxForImage from './LightboxForImage';


function BookDetail() {
    const { bookId, countryCode } = useParams();
    const [book, setBook] = useState(null);
    const [similarBooks, setSimilarBooks] = useState([]);
    const [isKeyInsightsClicked, setIsKeyInsightsClicked] = useState(false);
    const [isMoreDetailsClicked, setIsMoreDetailsClicked] = useState(false);
    const [isAnecdotesClicked, setIsAnecdotesClicked] = useState(false);
    const [isQuotesClicked, setIsQuotesClicked] = useState(false);
    const [isPreviewClicked, setIsPreviewClicked] = useState(false);
    const lightboxContentRef = useRef(null);
    const [lightboxContent, setLightboxContent] = useState('');
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isAtBottomLightbox, setIsAtBottomLightbox] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [userData, setUserData] = useState(null);
    const [lightboxImageUrl, setLightboxImageUrl] = useState(null);
    const [isLightboxForImageOpen, setIsLightboxForImageOpen] = useState(false);

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [bookId]);

    useEffect(() => {
      checkAuthStatus().then((userData) => {
        if (userData) {
          setUserData(userData);
        }
      });
    }, [setUserData]);
    
    const saveHistoryCalled = useRef(false);

    useEffect(() => {
      // console.log("Effect check on bookId change");
      // Reset the saveHistoryCalled flag whenever the bookId changes
      saveHistoryCalled.current = false;
    }, [bookId]); // Add bookId to dependency array
    
    // Cleanup on component unmount or bookId change
    useEffect(() => {
      return () => {
        // console.log("Cleaning up...");
        saveHistoryCalled.current = false;
      };
    }, [bookId]); // Ensures that saveHistoryCalled is reset when the bookId changes
    
    
    const handleStopStreaming = useCallback(async () => {
        try {
          await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/stop-stream`);
          setIsStreaming(false);
          
        } catch (error) {
          console.error('Error stopping the stream:', error);
        }
      }, []);

    useStreamChunkHandler(
        socket,
        () => null, // Getting session ID from ref for Chat.js
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

  const fetchSimilarBooks = useCallback(async (genres, countryCode) => {
    // Adding check for userData being null or undefined
    if (!genres || !countryCode || !userData || !userData.id) {
      return;
    }

    try {
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/books`, {
          genre: genres,  // Assuming genres is an array of strings
          countryCode: countryCode,
          userId: userData.id  // Passing the user ID for context or authorization
        });
        const filteredBooks = response.data.filter(book => book._id !== bookId);
        setSimilarBooks(filteredBooks);
    } catch (error) {
        console.error('Failed to fetch similar books', error);
    }
  }, [bookId, userData]);  // Notice userData instead of userData.id to capture the whole object


    // Adjust fetchBookDetails to include fetchSimilarBooks as a stable dependency
    const fetchBookDetails = useCallback(async () => {
        if (!countryCode) {
            console.error('Country code not provided');
            return;
        }
        try {
            const url = `${process.env.REACT_APP_BACKEND_URL}/api/books/${bookId}/${encodeURIComponent(countryCode)}`;
            const response = await fetch(url);
            const data = await response.json();
            setBook(data);
            
            // Fetch similar books after setting main book details
            if (data.genres) {
                fetchSimilarBooks(data.genres.join(','), countryCode);
            }
        } catch (error) {
            console.error('Failed to fetch book details', error);
        }
    }, [bookId, countryCode, fetchSimilarBooks]); 
    
    // For fetching book details
    useEffect(() => {
      fetchBookDetails();
    }, [fetchBookDetails]);

    if (!book) {
        return (
            <div className="loading-overlay">
            </div>
        );
    }

    // const getTitleMinHeight = (title) => {
    //     const lineChars = 25;
    //     const lineCount = Math.ceil(title.length / lineChars);
    //     return lineCount > 1 ? '3rem' : '1.5rem';
    // };

    // Use countrySpecific data if available
    const { title, author, previewLink, countrySpecific } = book;
    const countryData = countrySpecific;

    if (!countryData) {
        return <div>No country-specific data available.</div>;
    }

    const handleQuerySubmit = async (query, isMoreDetails = false, bookDataObjectId = null, bookTitle = null, author = null, moreBooks = false, isKeyInsights = false, isAnecdotes = false, isQuotes = false) => {
      if (userData && userData.id) {
        socket.emit('book-detail', {
          message: {
              role: 'user',
              content: query
          },
          isMoreDetails,
          isKeyInsights,
          isAnecdotes,
          isQuotes,
          bookDataObjectId,
          bookTitle,
          author,
          userId: userData.id,
          moreBooks
        });
      } 
    };

    const wrappedHandleKeyInsightsRequest = (bookDataObjectId, bookTitle, author) => {
        handleKeyInsightsRequest(
          bookDataObjectId,
          bookTitle,
          author,
          handleQuerySubmit,
          setIsLightboxOpen,
          setLightboxContent
        );
      };

      const wrappedHandleAnecdotesRequest = (bookDataObjectId, bookTitle, author) => {
        handleAnecdotesRequest(
          bookDataObjectId,
          bookTitle,
          author,
          handleQuerySubmit,
          setIsLightboxOpen,
          setLightboxContent
        );
      };
    
      const wrappedHandleQuotesRequest = (bookDataObjectId, bookTitle, author) => {
        handleQuotesRequest(
          bookDataObjectId,
          bookTitle,
          author,
          handleQuerySubmit,
          setIsLightboxOpen,
          setLightboxContent
        );
      };
    
      const wrappedHandleMoreDetailsRequest = (bookDataObjectId, bookTitle, author) => {
        handleMoreDetailsRequest(
          bookDataObjectId,
          bookTitle,
          author,
          handleQuerySubmit,
          setIsLightboxOpen,
          setLightboxContent
        );
      };

      const handleKeyInsightsClick = (event) => {
        const button = event.currentTarget;
        const bookDataObjectId = button.getAttribute('data-book-data-object-id');
        const bookTitle = button.getAttribute('data-book-title');
        const author = button.getAttribute('data-author');

        if (!isKeyInsightsClicked && wrappedHandleKeyInsightsRequest) {
          setIsKeyInsightsClicked(true);
          wrappedHandleKeyInsightsRequest(bookDataObjectId, bookTitle, author);
      
          // Reset the state after a delay
          setTimeout(() => {
            setIsKeyInsightsClicked(false);
          }, 3500); 
        }
      };    

      const handleMoreDetailsClick = (event) => {
        const button = event.currentTarget;
        const bookDataObjectId = button.getAttribute('data-book-data-object-id');
        const bookTitle = button.getAttribute('data-book-title');
        const author = button.getAttribute('data-author');

        if (!isMoreDetailsClicked && wrappedHandleMoreDetailsRequest) {
          setIsMoreDetailsClicked(true);
          wrappedHandleMoreDetailsRequest(bookDataObjectId, bookTitle, author);
      
          setTimeout(() => {
            setIsMoreDetailsClicked(false);
          }, 3500); // Adjust the delay as needed
        }
      };
      
      const handleAnecdotesClick = (event) => {
        const button = event.currentTarget;
        const bookDataObjectId = button.getAttribute('data-book-data-object-id');
        const bookTitle = button.getAttribute('data-book-title');
        const author = button.getAttribute('data-author');

        if (!isAnecdotesClicked && wrappedHandleAnecdotesRequest) {
          setIsAnecdotesClicked(true);
          wrappedHandleAnecdotesRequest(bookDataObjectId, bookTitle, author);
      
          setTimeout(() => {
            setIsAnecdotesClicked(false);
          }, 3500); // Adjust the delay as needed
        }
      };
    
      const handleQuotesClick = (event) => {
        const button = event.currentTarget;
        const bookDataObjectId = button.getAttribute('data-book-data-object-id');
        const bookTitle = button.getAttribute('data-book-title');
        const author = button.getAttribute('data-author');

        if (!isQuotesClicked && wrappedHandleQuotesRequest) {
          setIsQuotesClicked(true);
          wrappedHandleQuotesRequest(bookDataObjectId, bookTitle, author);
      
          setTimeout(() => {
            setIsQuotesClicked(false);
          }, 3500); // Adjust the delay as needed
        }
      };

      const handlePreviewClick = (event) => {
        const button = event.currentTarget;
        const previewLink = button.getAttribute('data-preview-link');
        if (!isPreviewClicked) {
          setIsPreviewClicked(true);
          window.gtag('event', 'conversion', {'send_to': 'AW-16524885939/bdeKCIjxv7wZELP_1sc9'});

          if (previewLink) {
            window.open(previewLink, '_blank');
          }
      
          setTimeout(() => {
            setIsPreviewClicked(false);
          }, 3500); // Adjust the delay as needed
        }
      };

      


      const getTitleMinHeight = (title) => {
        // Roughly estimate the number of lines in the title
        const lineChars = 25; // Assuming approx 25 chars fit in one line for the current font-size and container width
        const lineCount = Math.ceil(title.length / lineChars);
        return lineCount > 1 ? '3rem' : '1.5rem'; // 3rem for multiline, 1.5rem for single line
      };
    
      const handleImageClick = (imageUrl) => {
        setLightboxImageUrl(imageUrl);
        setIsLightboxForImageOpen(true);
      };

    return (
      <div>
        <BookDetailHeader />

        <LightboxForImage
          isOpen={isLightboxForImageOpen}
          onClose={() => {
            setIsLightboxForImageOpen(false);
            if (isStreaming) {
              handleStopStreaming(); // Stop streaming if it's active
            }
          }}
          imageUrl={lightboxImageUrl}
        />
      
        <div className="book-detail">
            <Lightbox
                isOpen={isLightboxOpen}
                content={lightboxContent}
                onClose={() => {
                    setIsLightboxOpen(false);
                    setLightboxContent(''); // Clear the content when Lightbox is closed
                    if (isStreaming) {
                        handleStopStreaming(); // Stop streaming if it's active
                    }
                }}
                contentRef={lightboxContentRef}
                />
            <div className="main-book">
                <div className="main-book-container" style={{ display: 'flex' }}>
                    <div className="book-item">
                    <img 
                      src={countryData.bookImage} 
                      alt="" 
                      onClick={() => handleImageClick(countryData.bookImage)} // Added onClick event here
                    />
                      <div
                          className="title"
                          style={{ minHeight: getTitleMinHeight(title) }}
                      >
                          {title}
                      </div>
                      <div className="author">{author}</div>
                      {(countryData.amazonStarRating !== 'Unknown' && countryData.amazonReviewCount !== 'Unknown') && (
                          <div className="ratings-and-review">
                              <div className="star-rating">
                                  {renderStarRating(countryData.amazonStarRating)}
                              </div>
                              <span className="review-count">{countryData.amazonReviewCount}</span>
                          </div>
                      )}
                    </div>
                    <div className="book-buttons">
                        <BuyNowButton link={countryData.amazonLink} userEmail={userData?.email}/>
                        <MoreDetailsButton
                            bookDataObjectId={bookId}
                            bookTitle={title}
                            author={author}
                            onClick={(event) => handleMoreDetailsClick(event)}
                        />
                        <KeyInsightsButton
                            bookDataObjectId={bookId}
                            bookTitle={title}
                            author={author}
                            onClick={(event) => handleKeyInsightsClick(event)}
                        />
                        <AnecdotesButton
                            bookDataObjectId={bookId}
                            bookTitle={title}
                            author={author}
                            onClick={(event) => handleAnecdotesClick(event)}
                        />
                        <QuotesButton
                            bookDataObjectId={bookId}
                            bookTitle={title}
                            author={author}
                            onClick={(event) => handleQuotesClick(event)}
                        />
                        <PreviewButton
                            previewLink={previewLink}
                            onClick={(event) => handlePreviewClick(event)}
                        />
                    </div>
                </div>
              </div>
             
              <div className="similar-books">
              {similarBooks.length > 0 && (
                <div className="book-list">
                    {similarBooks.map(similarBook => (
                        <Link to={`/books/${similarBook._id}/${countryCode}`} key={similarBook._id} className="book-item" style={{ textDecoration: 'none' }}>
                            <img src={similarBook.bookImage} alt="" />
                            <div
                                className="title"
                                style={{ minHeight: getTitleMinHeight(similarBook.title) }} 
                            >
                                {similarBook.title}
                            </div>
                            <div className="author">{similarBook.author}</div>

                            {(similarBook.amazonStarRating !== 'Unknown' && similarBook.amazonReviewCount !== 'Unknown') && (
                                <div className="ratings-and-review">
                                    <div className="star-rating">
                                        {renderStarRating(similarBook.amazonStarRating)}
                                    </div>
                                    <span className="review-count">{similarBook.amazonReviewCount}</span>
                                </div>
                            )}
                        </Link>
                    ))}
                    </div>
                    )}
                </div>
              
        </div>
        </div>
    );
    
}

export default BookDetail;