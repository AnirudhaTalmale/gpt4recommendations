import React, { useEffect, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import '../App.css';

function AnswerDisplay({ role, content, contentType, userImage, isStreaming }) {
  const [dynamicContent, setDynamicContent] = useState(content);

  useEffect(() => {
    setDynamicContent(content);
  }, [content]);

  const updateButtonStyles = useCallback(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = dynamicContent;

    const buttons = tempDiv.querySelectorAll('.more-details-btn');
    buttons.forEach(button => {
      button.disabled = isStreaming;
      button.style.backgroundColor = isStreaming ? 'red' : 'green';
    });

    return tempDiv.innerHTML;
  }, [isStreaming, dynamicContent]); // Now updateButtonStyles will only change if isStreaming or dynamicContent changes

  useEffect(() => {
    const updatedContent = updateButtonStyles();
    setDynamicContent(updatedContent);
  }, [isStreaming, updateButtonStyles]);

  const createMarkup = () => {
    // Sanitize and set HTML content
    const safeHTML = DOMPurify.sanitize(dynamicContent);
    return { __html: safeHTML };
  };

  return (
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
            <div className="message-answer" dangerouslySetInnerHTML={createMarkup()} />
          </>
        )}
      </div>
    </div>
  );
}

export default AnswerDisplay;
