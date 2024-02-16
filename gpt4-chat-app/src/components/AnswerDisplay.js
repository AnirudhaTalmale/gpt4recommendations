import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import axios from 'axios';
import LightboxForBookPreview from './LightboxForBookPreview';
import '../App.css';

function AnswerDisplay({ 
  role, content, userImage, isStreaming, 
  onMoreDetailsClick, onKeyInsightsClick, onAnecdotesClick, showContinueButton, onContinueGenerating 
}) {
  const viewerRef = useRef(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [bookIdForPreview, setBookIdForPreview] = useState('');
  const [isViewerLoaded, setIsViewerLoaded] = useState(false); // State to manage the viewer's load status

  // This function will be modified to load the viewer only upon a button click
  const loadGoogleBooksViewer = (bookId) => {
    if (window.google && window.google.books && viewerRef.current) {
      var viewer = new window.google.books.DefaultViewer(viewerRef.current);
      viewer.load(`ISBN:${bookId}`, function() {
        console.error("Google Books could not load the book.");
      });
    }
  };

  useEffect(() => {
    if (!window.google || !window.google.books) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/books/jsapi.js';
      script.onload = () => {
        window.google.books.load();
        setIsViewerLoaded(true); // Set state to true indicating the Google Books API is loaded
      };
      document.body.appendChild(script);
    } else {
      setIsViewerLoaded(true); // If the script is already there, just update the state
    }
  }, []);

  const handlePreviewClick = async (title) => {
    if (isViewerLoaded) {
      try {
        const response = await axios.get(`http://localhost:3000/api/book/isbn?bookTitle=${encodeURIComponent(title)}`);
        const isbn = response.data.isbn;
        if (isbn) { // This will be false if isbn is an empty string
          setBookIdForPreview(isbn); // Store the book ID (or ISBN) for preview
          setIsLightboxOpen(true); // Open the Lightbox
        } else {
          console.log("ISBN not found for the book");
          // Optionally, handle the case when an ISBN is not available
        }
      } catch (error) {
        console.error("Error fetching ISBN:", error);
      }
    }
  };
  

  useEffect(() => {
    if (isLightboxOpen && bookIdForPreview) {
      loadGoogleBooksViewer(bookIdForPreview); // Ensure this function is adapted to work with this setup
    }
  }, [isLightboxOpen, bookIdForPreview]);
  
  

  const createMarkup = () => {
    const safeHTML = DOMPurify.sanitize(content, {
      ADD_ATTR: ['target'], // Allow 'target' attribute for anchor tags
    });
    return { __html: safeHTML };
  };

  const handleMoreDetailsClick = (bookTitle, author) => {
    if (onMoreDetailsClick) {
      onMoreDetailsClick(bookTitle, author);
    }
  };
  
  const handleKeyInsightsClick = (bookTitle, author) => {
    if (onKeyInsightsClick) {
      onKeyInsightsClick(bookTitle, author);
    }
  };

  const handleAnecdotesClick = (bookTitle, author) => {
    console.log("i am here");
    if (onAnecdotesClick) {
      onAnecdotesClick(bookTitle, author);
    }
  };
  
  
  // In AnswerDisplay component
  const handleContinueGenerating = () => {
    if (onContinueGenerating) {
      onContinueGenerating();
    }
  };

  const messageAnswerRef = useRef(null);

  useEffect(() => {
    // Check the number of buttons inside the message-answer after each render
    const messageAnswer = messageAnswerRef.current;
    if (messageAnswer) {
      const buttons = messageAnswer.getElementsByTagName('button');
      if (buttons.length === 1) {
        // Add a specific class to the single button
        buttons[0].classList.add('single-button');
      } else {
        Array.from(buttons).forEach(button => {
          // Remove the class if more than one button is present
          button.classList.remove('single-button');
        });
      }
    }
  });

  return (
    <div className={`chat-area-wrapper ${isStreaming ? 'streaming' : ''}`}>
      <div className={`message ${role}`}>
        <div className="message-icon">
          {role === 'user' ? (
            userImage ? (
              <div><img src={userImage} alt="/favicon.ico" className="display-image" /></div> // Display user image
            ) : (
              <span>U</span> // Fallback if no image is available
            )
          ) : (
            <div><img src="/favicon.ico" className="display-image" alt="" /></div> // Icon for the assistant
          )}
        </div>
        <div className="message-content" onClick={(e) => {
          if (e.target.classList.contains('more-details-btn')) {
            const bookTitle = e.target.getAttribute('data-book-title');
            const author = e.target.getAttribute('data-author');
            handleMoreDetailsClick(bookTitle, author);
          } else if (e.target.classList.contains('key-insights-btn')) {
            const bookTitle = e.target.getAttribute('data-book-title');
            const author = e.target.getAttribute('data-author');
            handleKeyInsightsClick(bookTitle, author);
          } else if (e.target.classList.contains('anecdotes-btn')) {
            const bookTitle = e.target.getAttribute('data-book-title');
            const author = e.target.getAttribute('data-author');
            handleAnecdotesClick(bookTitle, author);
          } else if (e.target.classList.contains('preview-btn')) {
            const bookTitle = e.target.getAttribute('data-book-title');
            const author = e.target.getAttribute('data-author');
            handlePreviewClick(bookTitle, author);
          }
        }}>
          {role === 'user' && (
            <>
              <div className="message-sender">You</div>
              <br></br>
              <div className="message-question">{content}</div>
            </>
          )}
          {role === 'assistant' && (
            <>
              <div className="message-sender">ChatGPT</div>
              <br></br>
              <div className="message-answer" ref={messageAnswerRef} dangerouslySetInnerHTML={createMarkup()} />
              {showContinueButton && !isStreaming && (
                <div className="button-container">
                  <button className="continue-generating-btn" onClick={handleContinueGenerating}>
                    <i className="fa-solid fa-forward"></i> More books
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <LightboxForBookPreview
        isOpen={isLightboxOpen}
        onClose={() => {
          setIsLightboxOpen(false);
          setBookIdForPreview(''); // Reset book ID when closing lightbox
        }}
        contentRef={viewerRef}
      />
    </div>
  );
}

export default AnswerDisplay;
