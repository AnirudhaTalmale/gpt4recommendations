import React, { useState, useRef, useEffect, forwardRef } from 'react';
import axios from 'axios';
import '../App.css';

const HistoryPane = forwardRef(({
  sessions, 
  onNewSession,
  onSelectSession, 
  onDeleteSession, 
  userName, 
  userImage, 
  isPaneOpen, 
  togglePane,
  isAdmin,
  unseenMessageCounts,
  userId
}, ref) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEntryActive, setIsEntryActive] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);


  const dropdownRef = useRef(null);
  const userEntryRef = useRef(null);

  useEffect(() => {
    // Apply the class based on the initial state of the pane
    document.body.classList.toggle('history-pane-open', isPaneOpen);
  }, [isPaneOpen]);

  const handleChatWithUs = () => {
    // Redirect to the Chat with Us page or handle the action
    window.location.href = '/';
  };

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

  const handleClosePane = () => {
    togglePane(); // Use togglePane prop to change pane state
    document.body.classList.toggle('history-pane-open', !isPaneOpen);
  };

  const handleNewSessionCreation = async () => {
    await onNewSession();
    if (window.innerWidth < 760) { // Check if screen size is less than 760px
      togglePane(); // Collapse the pane
    }
  };
  

  const handleSessionSelect = async (index) => {
    const sessionId = sessions[index]._id;
    setActiveSessionId(sessionId); // Set the active session ID
    onSelectSession(sessionId);
    if (window.innerWidth < 760) {
      togglePane();
    }
  };


  return (
    <div ref={ref}>
      <div className={`history-pane ${isPaneOpen ? '' : 'closed'}`}>
      <button onClick={handleClosePane} className={`close-pane-button ${!isPaneOpen ? 'close-pane-button-closed' : ''}`}>
        {isPaneOpen ? <i className="fa-solid fa-angle-left"></i> : <i className="fa-solid fa-angle-right"></i>}
      </button>

      <div className="header-container">
        <button className="new-session-button">ChatGPT</button>
        {/* Conditionally render only the new session button */}
        {!isAdmin && (
          <button className="new-session-button" onClick={handleNewSessionCreation}>
            <i className="fa-regular fa-pen-to-square"></i>
          </button>
        )}
      </div>


      <div className="history-content">  
        {[...sessions].reverse().map((session, index) => (
          <div 
            key={session._id} 
            className={`history-entry ${activeSessionId === session._id ? 'active' : ''}`} 
            onClick={() => handleSessionSelect(sessions.length - index - 1)}
          >
            <div className={unseenMessageCounts[session._id] > 0 ? 'session-name bold-text' : 'session-name'}>
                {session.sessionName} {/* Display the actual session name */}
                {unseenMessageCounts[session._id] > 0 && (
                  <span className="unseen-messages-count">{unseenMessageCounts[session._id]}</span>
                )}
            </div>
            {isAdmin && (
              <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session._id); }} className="delete-session-button">
                  <i className="fa-solid fa-trash"></i>
              </button>
            )}
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
              <li onClick={handleChatWithUs}>
                <i class="fa-solid fa-comments"></i> ChatGPT
              </li>
              <li onClick={handleLogout}>
                <i class="fa-solid fa-arrow-right-from-bracket"></i> Log out
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
});

export default HistoryPane;
