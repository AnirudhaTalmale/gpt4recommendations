import React from 'react';
import '../App.css';

function AnswerDisplay({ role, content, contentType }) {
  const createMarkup = (htmlString) => {
    return { __html: htmlString };
  };

  return (
    <div className={`message ${role}`}>
      <div className="message-icon">
        {/* Here, you can put the icon for the message sender */}
        {role === 'user' ? <span>U</span> : <span>A</span>}
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
