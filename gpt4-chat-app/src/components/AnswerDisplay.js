import React from 'react';
import DOMPurify from 'dompurify';
import '../App.css';

function AnswerDisplay({ 
  role, content, userImage, isStreaming, 
  onMoreDetailsClick, showContinueButton, onContinueGenerating 
}) {
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

  // In AnswerDisplay component
  const handleContinueGenerating = () => {
    if (onContinueGenerating) {
      onContinueGenerating();
    }
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
              <div className="message-answer" dangerouslySetInnerHTML={createMarkup()} />
              {showContinueButton && !isStreaming && ( 
                <button className="continue-generating-btn" onClick={handleContinueGenerating}>
                  Continue Generating
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnswerDisplay;
