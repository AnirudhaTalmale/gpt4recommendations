import React from 'react';
import '../App.css';

function AnswerDisplay({ role, content, contentType }) {

  const createMarkup = (htmlString) => {
    return { __html: htmlString };
  };

  return (
    <div className={`message ${role}`}>
      {role === 'user' && (
        <>
          <div className="message-icon">You</div>
          <br></br>
          <div className="message-question">{content}</div>
        </>
      )}
      {role === 'assistant' && (
        <>
          <div className="message-icon">ChatGPT</div>
          <br></br>
          <div className="message-answer" dangerouslySetInnerHTML={createMarkup(content)} />
        </>
      )}
    </div>
  );
}

export default AnswerDisplay;
