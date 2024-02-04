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
    document.body.classList.toggle('history-pane-open-chat-with-us', isPaneOpen);
  }, [isPaneOpen]);

  const handleChatWithUs = () => {
    window.location.href = '/';
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          userEntryRef.current && !userEntryRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsEntryActive(!isDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      const response = await axios.get('http://localhost:3000/auth/logout', { withCredentials: true });
      if (response.data.message === 'Logged out successfully') {
        window.location.href = 'http://localhost:3001';
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleClosePane = () => {
    togglePane();
    document.body.classList.toggle('history-pane-open-chat-with-us', !isPaneOpen);
  };

  const handleNewSessionCreation = async () => {
    await onNewSession();
    if (window.innerWidth < 760) {
      togglePane();
    }
  };

  const handleSessionSelect = async (index) => {
    const sessionId = sessions[index]._id;
    setActiveSessionId(sessionId);
    onSelectSession(sessionId);
    if (window.innerWidth < 760) {
      togglePane();
    }
  };

  return (
    <div ref={ref}>
      <div className={`history-pane-chat-with-us ${isPaneOpen ? '' : 'closed-chat-with-us'}`}>
        <button onClick={handleClosePane} className={`close-pane-button-chat-with-us ${!isPaneOpen ? 'close-pane-button-closed-chat-with-us' : ''}`}>
          {isPaneOpen ? <i className="fa-solid fa-angle-left"></i> : <i className="fa-solid fa-angle-right"></i>}
        </button>

        <div className="header-container-chat-with-us">
          <button className="new-session-button-chat-with-us">ChatGPT</button>
          {!isAdmin && (
            <button className="new-session-button-chat-with-us" onClick={handleNewSessionCreation}>
              <i className="fa-regular fa-pen-to-square"></i>
            </button>
          )}
        </div>

        <div className="history-content-chat-with-us">  
          {[...sessions].reverse().map((session, index) => (
            <div 
              key={session._id} 
              className={`history-entry-chat-with-us ${activeSessionId === session._id ? 'active' : ''}`} 
              onClick={() => handleSessionSelect(sessions.length - index - 1)}
            >
              <div className={unseenMessageCounts[session._id] > 0 ? 'session-name bold-text' : 'session-name'}>
                  {session.sessionName}
                  {unseenMessageCounts[session._id] > 0 && (
                    <span className="unseen-messages-count">{unseenMessageCounts[session._id]}</span>
                  )}
              </div>
              {isAdmin && (
                <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session._id); }} className="delete-session-button-chat-with-us">
                    <i className="fa-solid fa-trash"></i>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="user-info-container-chat-with-us">
          <div className={`user-entry-chat-with-us ${isEntryActive ? 'active' : ''}`} onClick={toggleDropdown} ref={userEntryRef}>
            <img src={userImage} alt="" className="history-pane-image-chat-with-us" />
            <span>{userName}</span>
          </div>
          {isDropdownOpen && (
            <ul className="dropdown-menu-chat-with-us" ref={dropdownRef}>
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
