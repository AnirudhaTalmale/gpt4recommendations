import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Header({ isPaneOpen, togglePane }) {


  const navigate = useNavigate(); 
  const onNewSession = async () => {
    navigate(`/chat`);
  };

  return (
    <div className="header">
        <>
          <button className="menu-button-small-screen" onClick={togglePane}>
            <i className="fa-solid fa-bars"></i>
          </button>
          <div className="header-title">GPT-4</div>
          <button className="new-session-button-small-screen" onClick={onNewSession}>
            <i className="fa-regular fa-pen-to-square"></i>
          </button>
        </>
     
    </div>
  );
}

export default Header;
