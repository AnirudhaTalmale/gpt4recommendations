import React from 'react';
import '../App.css';

function AnswerDisplay({ question, response }) {
  const formatResponse = (response) => {
    if (!response) return 'No response provided';
    if (response === 'Waiting for response...') return <p>Waiting for response...</p>;
    if (Array.isArray(response)) return response.map((book, i) => <BookData key={i} book={book} />);
    return response.split('\n').map((item, i) => <p key={i}>{item}</p>);
  };

  const BookData = ({ book }) => (
    <div className="book">
      {Object.entries(book).map(([key, value]) => <p key={key}><strong>{key}:</strong> {value}</p>)}
    </div>
  );

  return (
    <div className="message gpt-response">
      <p className="message-question"><strong>Q:</strong> {question || 'No question provided'}</p>
      <div className="message-answer"><strong>A:</strong>{formatResponse(response)}</div>
    </div>
  );
}

export default AnswerDisplay;
