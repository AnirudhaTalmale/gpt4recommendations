import React from 'react';
import '../App.css';

function Header({ isPaneOpen, onNewSession }) { // Add onNewSession prop
  return (
    <div className="header">
      {!isPaneOpen && (
        <button className="header-new-session-button" onClick={onNewSession}> {/* Add onClick handler */}
          <i className="fa-regular fa-pen-to-square"></i>
        </button>
      )}
      {/* ...rest of the header content */}
    </div>
  );
}

export default Header;
