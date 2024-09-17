// HeaderWithBackButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 

const HeaderWithHomeButton = () => {
  const navigate = useNavigate();

  return (
    <header className="header-with-back-button">
      <button onClick={() => navigate('/')} className="home-button">
        <i class="fa-solid fa-house"></i>
      </button>
    </header>
  );
};

export default HeaderWithHomeButton;
