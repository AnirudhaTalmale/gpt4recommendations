import React from 'react';
import '../App.css';

function AnswerDisplay({ question, response }) {
  // Function to format the response
  const formatResponse = (response) => {
    if (!response) return 'No response provided';

    // If the response is a placeholder, display a loading message
    if (response === 'Waiting for response...') {
      return <p>Loading response...</p>;
    }

    // Format the actual response
    return response.split('\n').map((item, index) => {
      const match = item.match(/(\d+\.\s)([A-Z][\w\s]*(?=:))/);
      if (match) {
        return (
          <p key={item + index}> {/* Unique key using item content and index */}
            <strong>{match[1]}</strong>{/* Number and period */}
            <strong>{match[2]}</strong>{/* Capitalized words */}
            {item.substring(match[0].length)}{/* Rest of the text */}
          </p>
        );
      } else {
        return <p key={item + index}>{item}</p>; {/* Unique key using item content and index */}
      }
    });    
  };

  return (
    <div className="message gpt-response">
      <p className="message-question"><strong>Q:</strong> {question || 'No question provided'}</p>
      <div className="message-answer"><strong>A:</strong>
        {response === 'Waiting for response...' ? (
          <p>Loading response...</p>
        ) : (
          <div className="formatted-response">
            {formatResponse(response)}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnswerDisplay;
