import React from 'react';
import '../App.css';

function AnswerDisplay({ role, content, contentType, userImage }) {
  const createMarkup = (htmlString) => {
    return { __html: htmlString };
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
            <div className="message-answer" dangerouslySetInnerHTML={createMarkup(content)} />
          </>
        )}
      </div>
    </div>
  );
}

export default AnswerDisplay;
