import React, { useState, useRef } from 'react';
import '../App.css';

function InputBox({ onSubmit, isStreaming, onStopStreaming, isPaneOpen, isAdmin }) {
  const [input, setInput] = useState('');
  const [isInputNotEmpty, setIsInputNotEmpty] = useState(false);
  const [rows, setRows] = useState(1);

  const textareaRef = useRef(null);
  const rowHeightRem = 1.75; // Estimated row height in rem
  const maxHeightRem = 12; // Max height in rem
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    onSubmit(trimmedInput);
    setInput('');
    setIsInputNotEmpty(false); // Add this line
    setRows(1);
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
    if (isAdmin) {
      window.fbq && window.fbq('track', 'Search', {
        search_string: trimmedInput
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to stop new line

      // Check if streaming is active; if so, do not submit
      if (isStreaming) {
        return;
      }

      if (input.trim()) { // Only submit if there's input
        handleSubmit(e);
      }
    } 
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInput(newValue);

    // Set isInputNotEmpty based on whether newValue contains non-whitespace characters
    setIsInputNotEmpty(newValue.trim() !== '');
  
    // Existing line count based on new line characters
    const lineCountNewLines = e.target.value.split('\n').length;
  
    // Calculate line count based on text wrapping
    // Note: This is a simplified example and might need adjustments based on your CSS and font settings.
    const textWidth = getTextWidth(e.target.value, getComputedStyle(textareaRef.current).font);
    const textareaWidth = textareaRef.current.clientWidth;
    const lineCountWrap = Math.ceil(textWidth / textareaWidth);
  
    // Combine the two methods for a more accurate count
    const totalLineCount = Math.max(lineCountNewLines, lineCountWrap);
  
    setRows(Math.min(totalLineCount, maxHeightRem / rowHeightRem));
  }
  
  // Utility function to measure text width
  function getTextWidth(text, font) {
    // Create a temporary canvas element to measure text width
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    return context.measureText(text).width;
  }

  return (
    <form onSubmit={handleSubmit} className="input-area">
      <div className='input-box-container'>
        <textarea ref={textareaRef}
          className="input-box"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Message GetBooks.ai"
          rows={rows}
        />
        {isStreaming ? (
          <button type="button" className="stop-button" onClick={onStopStreaming} >
            <i className="fa-regular fa-circle-stop"></i>
          </button>
        ) : (
          <button type="submit" className={`send-button ${isInputNotEmpty ? 'active' : ''}`} disabled={!isInputNotEmpty} >
            <i className="fa-solid fa-arrow-up"></i>
          </button>
        )}
      </div>
      <p className="disclaimer-text">Each query is independent. Prior context is not considered.</p>
    </form>

  );
};

export default InputBox;