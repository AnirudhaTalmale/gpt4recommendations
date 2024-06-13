// HeaderWithBackButton.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 

const HeaderWithBackButton = () => {
  const navigate = useNavigate();

  return (
    <header className="header-with-back-button">
      <button onClick={() => navigate(-1)} className="back-button">
        <i className="fa-solid fa-chevron-left"></i> 
      </button>
    </header>
  );
};

export default HeaderWithBackButton;
