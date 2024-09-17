// HeaderWithBackButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 

const HeaderWithGetBooksButton = () => {
  const navigate = useNavigate();

  return (
    <header className="header-with-back-button">
      <button onClick={() => navigate('/')} className="home-button">
        <b>GetBooks.ai</b>
      </button>
    </header>
  );
};

export default HeaderWithGetBooksButton;
