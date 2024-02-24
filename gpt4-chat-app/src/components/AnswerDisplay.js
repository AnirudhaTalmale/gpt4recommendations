import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import '../App.css';

function AnswerDisplay({ 
  onPreviewClick, role, content, userImage, isStreaming, 
  onMoreDetailsClick, onKeyInsightsClick, onAnecdotesClick, showContinueButton, onContinueGenerating, onImageClick 
}) {
  const [isKeyInsightsClicked, setIsKeyInsightsClicked] = useState(false);
  const [isMoreDetailsClicked, setIsMoreDetailsClicked] = useState(false);
  const [isAnecdotesClicked, setIsAnecdotesClicked] = useState(false);
  const [isContinueGeneratingClicked, setIsContinueGeneratingClicked] = useState(false);

  const createMarkup = () => {
    const safeHTML = DOMPurify.sanitize(content, {
      ADD_ATTR: ['target'], // Allow 'target' attribute for anchor tags
    });
    return { __html: safeHTML };
  };
  
  const handleKeyInsightsClick = (bookTitle, author) => {
    if (!isKeyInsightsClicked && onKeyInsightsClick) {
      setIsKeyInsightsClicked(true);
      onKeyInsightsClick(bookTitle, author);
  
      // Reset the state after a delay
      setTimeout(() => {
        setIsKeyInsightsClicked(false);
      }, 3500); 
    }
  };
  
  const handleMoreDetailsClick = (bookTitle, author) => {
    if (!isMoreDetailsClicked && onMoreDetailsClick) {
      setIsMoreDetailsClicked(true);
      onMoreDetailsClick(bookTitle, author);
  
      setTimeout(() => {
        setIsMoreDetailsClicked(false);
      }, 3500); // Adjust the delay as needed
    }
  };
  
  const handleAnecdotesClick = (bookTitle, author) => {
    if (!isAnecdotesClicked && onAnecdotesClick) {
      setIsAnecdotesClicked(true);
      onAnecdotesClick(bookTitle, author);
  
      setTimeout(() => {
        setIsAnecdotesClicked(false);
      }, 3500); // Adjust the delay as needed
    }
  };
  
  const handleContinueGenerating = () => {
    if (!isContinueGeneratingClicked && onContinueGenerating) {
      setIsContinueGeneratingClicked(true);
      onContinueGenerating();
  
      setTimeout(() => {
        setIsContinueGeneratingClicked(false);
      }, 3500); // Adjust the delay as needed
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

  const handleImageClick = (src) => {
    onImageClick(src); // Propagate the click event and image source up to the parent component
  };

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
            const isbn = e.target.getAttribute('data-isbn');
            onPreviewClick(isbn);
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
              <div className="message-answer" 
                ref={messageAnswerRef} 
                dangerouslySetInnerHTML={createMarkup()} 
                onClick={(e) => {
                  if (e.target.tagName === 'IMG') {
                    handleImageClick(e.target.src);
                  }
                }}
              />
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
      
    </div>
  );
}

export default AnswerDisplay;
