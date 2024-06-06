import React, { useState, useEffect, useRef } from 'react';
import '../App.css';

function InputBox({ onSubmit, isStreaming, onStopStreaming, isPaneOpen }) {
  const [input, setInput] = useState('');
  const [isInputNotEmpty, setIsInputNotEmpty] = useState(false);
  const [rows, setRows] = useState(1);
  const [sendButtonRight, setSendButtonRight] = useState('2.3rem');
  const [stopButtonRight, setStopButtonRight] = useState('2.3rem');

  const updateButtonPositions = () => {
    const parentWidth = document.querySelector('.input-area').clientWidth;
    const inputBoxWidth = textareaRef.current.clientWidth;
    const newRightPosition = (parentWidth - inputBoxWidth) / 2 + 12 + 'px'; // Example calculation, adjust as needed
    setSendButtonRight(newRightPosition);
    setStopButtonRight(newRightPosition); // Update for stop button as well
  };  
  
  useEffect(() => {
    updateButtonPositions();
    window.addEventListener('resize', updateButtonPositions);
    return () => {
      window.removeEventListener('resize', updateButtonPositions);
    };
  }, [isPaneOpen]); // Add isPaneOpen to the dependency array
  
  
  const textareaRef = useRef(null);
  const rowHeightRem = 1.75; // Estimated row height in rem
  const maxHeightRem = 12; // Max height in rem

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
        <textarea ref={textareaRef}
          className="input-box"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="GPT-4 powered search"
          rows={rows}
        />
        {isStreaming ? (
          <button type="button" className="stop-button" onClick={onStopStreaming} style={{ right: stopButtonRight }}>
            <i className="fa-regular fa-circle-stop"></i>
          </button>
        ) : (
          <button type="submit" className={`send-button ${isInputNotEmpty ? 'active' : ''}`} disabled={!isInputNotEmpty} style={{ right: sendButtonRight }}>
            <i className="fa-solid fa-arrow-up"></i>
          </button>
        )}
    </form>

  );
};

export default InputBox;