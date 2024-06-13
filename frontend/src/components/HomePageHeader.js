// HomePageHeader.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const HomePageHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="home-page-header">
      <div className="clickable-area" onClick={() => navigate('/chat')}>
        <img alt="logo" src="/GetBooks_32_32.png" />
        <span>GetBooks.ai</span>
      </div>
    </header>
  );
};

export default HomePageHeader;
