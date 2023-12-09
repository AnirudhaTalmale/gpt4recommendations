import React from 'react';
import '../App.css';

function AnswerDisplay({ role, content, contentType }) {
  // Function to render book recommendation details
  const renderBookRecommendation = (book) => (
    <div className="book-recommendation">
      {Object.keys(book).map(key => (
        <p key={key}>
          <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {book[key]}
        </p>
      ))}
    </div>
  );

  return (
    <div className={`message ${role}`}>
      {role === 'user' && <p className="message-question"><strong>Q:</strong> {content}</p>}
      {role === 'assistant' && (
        <div className="message-answer">
          <strong>A:</strong>
          {contentType === 'bookRecommendation' ? 
            content.map(book => renderBookRecommendation(book)) : 
            content
          }
        </div>
      )}
    </div>
  );
}



export default AnswerDisplay;
