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
  selectedSessionId,
  setSelectedSessionId
}, ref) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEntryActive, setIsEntryActive] = useState(false);

  const dropdownRef = useRef(null);
  const userEntryRef = useRef(null);

  useEffect(() => {
    // Apply the class based on the initial state of the pane
    document.body.classList.toggle('history-pane-open', isPaneOpen);
  }, [isPaneOpen]);

  const handleChatWithUs = () => {
    // Redirect to the Chat with Us page or handle the action
    window.location.href = '/chat-with-us';
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
    const newSession = await onNewSession(); // Assume onNewSession returns the newly created session object
    setSelectedSessionId(newSession._id); // Set the selectedSessionId to the new session's ID
    if (window.innerWidth < 760) {
      togglePane();
    }
  };
  
  const handleSessionSelect = (session, index) => {
    onSelectSession(index);
    setSelectedSessionId(session._id); // Update the selected session ID
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

        <div onClick={handleNewSessionCreation} className="header-container">

          <button className="new-session-button">
            ChatGPT
          </button>
          
          <button  className="new-session-button">
            <i className="fa-regular fa-pen-to-square"></i>
          </button>
        </div>

        <div className="history-content">  
          {[...sessions].reverse().map((session, index) => (
            <div 
              key={session._id} 
              className={`history-entry ${selectedSessionId === session._id ? 'active' : ''}`} 
              onClick={() => handleSessionSelect(session, sessions.length - index - 1)}
            >
                <div>
                    {session.sessionName}
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
              <li onClick={handleChatWithUs}>
                <i class="fa-solid fa-comments"></i> Chat with Us
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
