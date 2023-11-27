import React from 'react';
import '../App.css';

function AnswerDisplay({ question, response }) {
  return (
    <div className="message gpt-response">
      {question && <div><strong>Q:</strong> {question}</div>} {/* Display the question */}
      {response && <div><strong>A:</strong> {response}</div>} {/* Display the response */}
    </div>
  );
}

export default AnswerDisplay;