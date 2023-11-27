import React from 'react';
import '../App.css';

function AnswerDisplay({ question, response }) {
  return (
    <div className="message gpt-response">
      <div><strong>Q:</strong> {question || 'No question provided'}</div>
      <div><strong>A:</strong> {response || 'No response provided'}</div>
    </div>
  );
}

export default AnswerDisplay;
