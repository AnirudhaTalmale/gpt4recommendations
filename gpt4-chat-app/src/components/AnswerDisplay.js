import React from 'react';
import '../App.css';

function AnswerDisplay({ role, content, contentType }) {

  // Function to create HTML from a string
  const createMarkup = (htmlString) => {
    return {__html: htmlString};
  };

  return (
    <div className={`message ${role}`}>
      {role === 'user' && <p className="message-question"><strong>Q:</strong> {content}</p>}
      {role === 'assistant' && (
        <div className="message-answer">
          <div dangerouslySetInnerHTML={createMarkup(content)} />
        </div>
      )}
    </div>
  );
}

export default AnswerDisplay;
