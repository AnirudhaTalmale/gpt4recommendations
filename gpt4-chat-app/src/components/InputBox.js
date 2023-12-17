import React, { useState } from 'react';
import '../App.css';

function InputBox({ onSubmit }) {
  const [input, setInput] = useState('');
  const [isInputNotEmpty, setIsInputNotEmpty] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(input);
    setInput('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setIsInputNotEmpty(e.target.value.length > 0);
  };

  return (
    <form onSubmit={handleSubmit} className="input-area">
      <div className="input-box-container">
        <input 
          type="text"
          className="input-box"
          value={input} 
          onChange={handleInputChange} 
          placeholder="Ask me anything..."
        />
        <button type="submit" className={`send-button ${isInputNotEmpty ? 'active' : ''}`}>
          <i className="fa-solid fa-arrow-up"></i>
        </button>
      </div>
    </form>
  );
};

export default InputBox;