import React, { useState, useEffect } from 'react';
import '../App.css';

function Header({ isPaneOpen, onNewSession, togglePane }) {
  const [isScreenSmall, setIsScreenSmall] = useState(window.innerWidth < 760);

  useEffect(() => {
    const handleResize = () => {
      setIsScreenSmall(window.innerWidth < 760);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="header">
      {isScreenSmall && (
        <>
          <button className="menu-button-small-screen" onClick={togglePane}>
            <i className="fa-solid fa-bars"></i>
          </button>
          <div className="header-title">Powered by GPT-4</div>
          <button className="new-session-button-small-screen" onClick={onNewSession}>
            <i className="fa-regular fa-pen-to-square"></i>
          </button>
        </>
      )}
      {!isScreenSmall && !isPaneOpen && (
        <div className="header-content">
          <button className="header-new-session-button" onClick={onNewSession}>
            <i className="fa-regular fa-pen-to-square"></i>
          </button>
          <div className="header-title-large">Powered by GPT-4</div>
        </div>
      )}
      {!isScreenSmall && isPaneOpen && (
        <div className="header-content">
          <div className="header-title-pane-open">Powered by GPT-4</div>
        </div>
      )}
    </div>
  );
}

export default Header;
