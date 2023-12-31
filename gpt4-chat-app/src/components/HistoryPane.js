import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

function HistoryPane({ sessions, onNewSession, onSelectSession, onDeleteSession, userName, userImage }) {
  const [isPaneOpen, setIsPaneOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEntryActive, setIsEntryActive] = useState(false);

  const dropdownRef = useRef(null);
  const userEntryRef = useRef(null);

  useEffect(() => {
    // Apply the class based on the initial state of the pane
    document.body.classList.toggle('history-pane-open', isPaneOpen);
  }, [isPaneOpen]);

  useEffect(() => {
    // Function to check if the click is outside the dropdown
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          userEntryRef.current && !userEntryRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    // Add or remove event listener based on dropdown state
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);


  const toggleDropdown = () => {
      setIsDropdownOpen(!isDropdownOpen);
      setIsEntryActive(!isDropdownOpen); // Toggle the active state along with the dropdown
  };

  // Custom function to handle new session creation
  const handleNewSession = () => {
    if (sessions.length > 0 && isSessionEmpty(sessions[sessions.length - 1])) {
      onSelectSession(sessions.length - 1);
    } else {
      onNewSession();
    }
  };

  const handleLogout = async () => {
    try {
      const response = await axios.get('http://localhost:3000/auth/logout', { withCredentials: true });
      if (response.data.message === 'Logged out successfully') {
        // Redirect to the home page or login page
        window.location.href = 'http://localhost:3001';
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const isSessionEmpty = (session) => {
    return session.messages.length === 0;
  };

  const handleClosePane = () => {
    setIsPaneOpen(!isPaneOpen);
    document.body.classList.toggle('history-pane-open', !isPaneOpen);
    console.log('Close pane clicked');
  };
  

  return (
    <div>
      <div className={`history-pane ${isPaneOpen ? '' : 'closed'}`}>
      <button onClick={handleClosePane} className={`close-pane-button ${!isPaneOpen ? 'close-pane-button-closed' : ''}`}>
        {isPaneOpen ? <i className="fa-solid fa-angle-left"></i> : <i className="fa-solid fa-angle-right"></i>}
      </button>

        <div className="header-container">
          
          <button onClick={handleNewSession} className="new-session-button">
            <i className="fa-regular fa-pen-to-square"></i>
          </button>
        </div>

        <div className="history-content">  
          {[...sessions].reverse().map((session, index) => (
            <div key={session._id} className="history-entry" onClick={() => onSelectSession(sessions.length - index - 1)}>
                <div>
                    {session.sessionName} {/* Display the actual session name */}
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session._id); }} className="delete-session-button">
                    <i className="fa-solid fa-trash"></i>
                </button>
            </div>
          ))}
        </div>

        <div className="user-info-container">
          <div className={`user-entry ${isEntryActive ? 'active' : ''}`} onClick={toggleDropdown} ref={userEntryRef}>
            <img src={userImage} alt="User" className="history-pane-image" />
            <span>{userName}</span>
          </div>
          {isDropdownOpen && (
            <ul className="dropdown-menu" ref={dropdownRef}>
              <li onClick={handleLogout}>
                <i class="fa-solid fa-arrow-right-from-bracket"></i> Log out
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryPane;
