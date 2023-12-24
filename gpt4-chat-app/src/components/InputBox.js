import React, { useState, useEffect, useRef } from 'react';
import '../App.css';

function InputBox({ onSubmit }) {
  const [input, setInput] = useState('');
  const [isInputNotEmpty, setIsInputNotEmpty] = useState(false);
  const [rows, setRows] = useState(1);
  const textareaRef = useRef(null);

  const initialHeightRem = 2.5; // Initial height in rem
  const maxHeightRem = 12; // Max height in rem
  const rowHeightRem = 1.75; // Estimated row height in rem

  useEffect(() => {
    // Adjust the row count when input changes
    const lineCount = input.split('\n').length;
    setRows(lineCount >= 1 ? lineCount : 1);
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(input);
    setInput('');
    setIsInputNotEmpty(false); // Add this line
    setRows(1);
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to stop new line
      if (input.trim()) { // Only submit if there's input
        handleSubmit(e);
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Handle Shift + Enter case
      // Logic to add a new line goes here (React will handle this automatically)
      // Optionally, adjust scroll position if necessary
      setTimeout(() => {
        if (textareaRef.current) {
          const currentScrollPosition = textareaRef.current.scrollTop;
          textareaRef.current.scrollTop = currentScrollPosition;
        }
      }, 0);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setIsInputNotEmpty(e.target.value.length > 0);
    const lineCount = e.target.value.split('\n').length;
    setRows(lineCount >= 1 ? lineCount : 1);
  };

  const containerHeight = Math.max(Math.min(rows * rowHeightRem, maxHeightRem), initialHeightRem);

  return (
    <form onSubmit={handleSubmit} className="input-area">
      <div className="input-box-container" style={{ height: `${containerHeight}rem` }}>
        <div className="textarea-wrapper">
          <textarea ref={textareaRef}
            className="input-box"
            value={input} 
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about books..."
            rows={rows}
          />
        </div>
        <button type="submit" className={`send-button ${isInputNotEmpty ? 'active' : ''}`}>
          <i className="fa-solid fa-arrow-up"></i>
        </button>
      </div>
    </form>
  );
};

export default InputBox;