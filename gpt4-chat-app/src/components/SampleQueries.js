// SampleQueries.js
import React from 'react';

const SampleQueries = ({ queries, onSubmit }) => {
  // Assuming you always have an even number of queries, split them into two rows.
  const half = Math.ceil(queries.length / 2);
  const firstRowQueries = queries.slice(0, half);
  const secondRowQueries = queries.slice(half);

  const handleClick = (query) => {
    onSubmit(query); // Directly call the handleQuerySubmit function with the query
  };

  return (
    <div className="sample-queries-container">
      <div className="sample-queries-row">
        {firstRowQueries.map((query, index) => (
          <button
            key={`first-${index}`}
            className="sample-query"
            onClick={() => handleClick(query)}
          >
            {query}
          </button>
        ))}
      </div>
      <div className="sample-queries-row">
        {secondRowQueries.map((query, index) => (
          <button
            key={`second-${index}`}
            className="sample-query"
            onClick={() => handleClick(query)}
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SampleQueries;
