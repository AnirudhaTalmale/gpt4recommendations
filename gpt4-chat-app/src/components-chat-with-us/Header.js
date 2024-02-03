import React, { useState, useEffect } from 'react';
import '../App.css';

function Header({ isPaneOpen, onNewSession, togglePane, isAdmin }) {
  const [isScreenSmall, setIsScreenSmall] = useState(window.innerWidth < 760);

  useEffect(() => {
    const handleResize = () => {
      setIsScreenSmall(window.innerWidth < 760);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="header-chat-with-us">
      {isScreenSmall && (
        <>
          <button className="menu-button-small-screen-chat-with-us" onClick={togglePane}>
            <i className="fa-solid fa-bars"></i>
          </button>
          {/* Conditionally render the new session button for small screens */}
          {!isAdmin && (
            <button className="new-session-button-small-screen-chat-with-us" onClick={onNewSession}>
              <i className="fa-regular fa-pen-to-square"></i>
            </button>
          )}
        </>
      )}
      {/* Conditionally render the new session button for larger screens */}
      {!isScreenSmall && !isPaneOpen && !isAdmin && (
        <button className="header-new-session-button-chat-with-us" onClick={onNewSession}>
          <i className="fa-regular fa-pen-to-square"></i>
        </button>
      )}
    </div>
  );
}

export default Header;
