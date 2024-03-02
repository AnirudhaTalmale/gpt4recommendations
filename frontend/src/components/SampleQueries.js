import React from 'react';
import { sampleQueries } from './queries'; // Imported here

const SampleQueries = ({ onSubmit, inputBoxHeight }) => {
  const half = Math.ceil(sampleQueries.length / 2);
  const firstRowQueries = sampleQueries.slice(0, half);
  const secondRowQueries = sampleQueries.slice(half);

  const maxHeightThreshold = 170;
  const adjustedHeight = Math.min(inputBoxHeight, maxHeightThreshold);
  const bottomPosition = `calc(0.5rem + ${adjustedHeight}px)`;

  const handleClick = (query) => {
    onSubmit(query); // Directly call the handleQuerySubmit function with the query
  };

  return (
    <div className="sample-queries-container" style={{ bottom: bottomPosition }}>
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
