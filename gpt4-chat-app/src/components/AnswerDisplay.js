import React from 'react';
import DOMPurify from 'dompurify';
import '../App.css';

function AnswerDisplay({ role, content, userImage, isStreaming, onMoreDetailsClick }) {
  const createMarkup = () => {
    const safeHTML = DOMPurify.sanitize(content);
    return { __html: safeHTML };
  };

  const handleMoreDetailsClick = (bookTitle, author) => {
    if (onMoreDetailsClick) {
      onMoreDetailsClick(`Explain this one book - ${bookTitle} by ${author}`);
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
            <div><img src="/favicon.ico" className="display-image" /></div> // Icon for the assistant
          )}
        </div>
        <div className="message-content">
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
              <div className="message-answer" dangerouslySetInnerHTML={createMarkup()} onClick={(e) => {
                if (e.target.classList.contains('more-details-btn')) {
                  const bookTitle = e.target.getAttribute('data-book-title');
                  const author = e.target.getAttribute('data-author');
                  handleMoreDetailsClick(bookTitle, author);
                }
              }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnswerDisplay;
