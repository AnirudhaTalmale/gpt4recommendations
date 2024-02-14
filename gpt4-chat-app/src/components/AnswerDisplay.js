import React, { useEffect, useState, useRef } from 'react';
import DOMPurify from 'dompurify';
import axios from 'axios';

import '../App.css';

function AnswerDisplay({ 
  role, content, userImage, isStreaming, 
  onMoreDetailsClick, onKeyInsightsClick, onAnecdotesClick, showContinueButton, onContinueGenerating 
}) {
  const [bookId, setBookId] = useState('');
  const [showModal, setShowModal] = useState(false);

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

  
  const handlePreviewClick = async (bookTitle, author) => {
    const query = `intitle:${encodeURIComponent(bookTitle)}${author ? `+inauthor:${encodeURIComponent(author)}` : ''}`;
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=AIzaSyBh8a2MssG5lBUgGmiX1ls7wIyjxyzUQ1k`;
    try {
      const response = await axios.get(apiUrl);
      if (response.data.items && response.data.items.length > 0) {
        const book = response.data.items[0];
        setBookId(book.id); // Set the Google Books ID state
      } else {
        console.log("No preview available");
        setBookId(''); // Reset the Google Books ID if no preview is available
      }
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching book preview:", error);
      setBookId(''); // Reset the Google Books ID in case of an error
    }
  };

  const renderBookPreviewModal = () => {
    if (!bookId) return null;

    const embedUrl = `https://books.google.com/books?id=${bookId}&hl=en&output=embed`;
    return (
      <div className="modal" style={{ display: showModal ? 'block' : 'none' }}>
        <div className="modal-content">
          <span className="close" onClick={() => setShowModal(false)}>&times;</span>
          <iframe
            src={embedUrl}
            width="600"
            height="1000"
            allowFullScreen
            title="Book Preview"
            style={{ border: 'none' }}
          ></iframe>
        </div>
      </div>
    );
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
      {renderBookPreviewModal()}
    </div>
  );
}

export default AnswerDisplay;
