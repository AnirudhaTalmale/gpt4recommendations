// HeaderWithBackButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 

const HeaderWithBlogButton = () => {
  const navigate = useNavigate();

  return (
    <header className="header-with-back-button">
      <button onClick={() => navigate('/blog')} className="home-button">
        <i class="fa-solid fa-blog"></i>
      </button>
    </header>
  );
};

export default HeaderWithBlogButton;
