import React, { useState } from 'react';
import '../App.css';

function InputBox({ onSubmit }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(input);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="input-area">
      <div className="input-box-container">
        <input 
          type="text"
          className="input-box"
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Ask me anything..."
        />
        <button type="submit" className="send-button">Send</button>
      </div>
    </form>
  );
}

export default InputBox;