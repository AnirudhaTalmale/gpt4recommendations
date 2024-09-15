import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConfirmationDialog from './ConfirmationDialog'; 
import UpgradePlanModal from './UpgradePlanModal';
import UpgradePlanModalIndia from './UpgradePlanModalIndia';
import socket from './socket';
import '../App.css';

const HistoryPane = forwardRef(({
  sessions, 
  onSelectSession, 
  onDeleteSession, 
  userName,
  userEmail,
  userImage,
  userCountry,
  isAdmin,
  isPaneOpen, 
  togglePane,
  selectedSessionId,
  setSelectedSessionId,
  userData
}, ref) => {

  // console.log("userCountry is", userCountry);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEntryActive, setIsEntryActive] = useState(false);

  const navigate = useNavigate(); 

  const paneRef = useRef(null);

  useEffect(() => {
    // Handles all clicks on the page to close the pane if clicked outside
    function handleOutsideClick(event) {
      if (paneRef.current && !paneRef.current.contains(event.target) && isPaneOpen) {
        togglePane(); // Close the pane
      }
    }

    // Attaching the event listener to the document
    document.addEventListener('mousedown', handleOutsideClick);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isPaneOpen, togglePane]);

  const getUserImage = () => {
    return userImage;
  };

  const dropdownRef = useRef(null);
  const userEntryRef = useRef(null);
  const confirmDialogRef = useRef(null);
  const upgradeModalRef = useRef(null);

  useEffect(() => {
    // Setup socket listener for opening the upgrade modal
    socket.on('open_upgrade_modal', () => {
      setIsUpgradeModalOpen(true);
    });

    return () => {
      socket.off('open_upgrade_modal');
    };
  }, []);

  useEffect(() => {
    // Function to check if the click is outside the dropdown
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          userEntryRef.current && !userEntryRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setIsEntryActive(false);
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

  const logInFunction = () => {
    window.location.href = `${process.env.REACT_APP_FRONTEND_URL}/login`;
  };

  const handleLogout = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/auth/logout`, { withCredentials: true });
      if (response.data.message === 'Logged out successfully') {
        // Redirect to the home page or login page
        window.location.href = `${process.env.REACT_APP_FRONTEND_URL}/chat`;
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleNewSessionCreation = async () => {
    navigate(`/chat`);
    // if (window.innerWidth < 760) {
      togglePane(); // Close the pane on smaller screens
    // }
  };

  
  const handleSessionSelect = (sessionId) => {
    onSelectSession(sessionId); 
    setSelectedSessionId(sessionId); 
    navigate(`/chat/${sessionId}`);
  
    // if (window.innerWidth < 760) {
      togglePane();
    // }
  };
  
  const categorizeSessions = (sessions, isAdmin) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
  
    // Sort sessions based on date
    sessions.sort((a, b) => {
      const dateA = new Date(isAdmin ? a.updatedAt : a.createdAt);
      const dateB = new Date(isAdmin ? b.updatedAt : b.createdAt);
      return dateB - dateA; // Sort descending
    });
  
    // Log sorted dates for verification
    // console.log("Sorted session dates:", sessions.map(session => new Date(isAdmin ? session.updatedAt : session.createdAt).toISOString()));
  
    const categories = {
      today: [],
      yesterday: [],
      last30Days: [],
      older: []
    };
  
    sessions.forEach(session => {
      const sessionDate = new Date(isAdmin ? session.updatedAt : session.createdAt);
      if (sessionDate.toDateString() === today.toDateString()) {
        categories.today.push(session);
      } else if (sessionDate.toDateString() === yesterday.toDateString()) {
        categories.yesterday.push(session);
      } else if (today - sessionDate <= 30 * 24 * 60 * 60 * 1000) {
        categories.last30Days.push(session);
      } else {
        categories.older.push(session);
      }
    });
  
    return categories;
  };
  

  // Inside the HistoryPane component
  const [categorizedSessions, setCategorizedSessions] = useState({
    today: [],
    yesterday: [],
    last30Days: [],
    older: []
  });

  useEffect(() => {
    if (isAdmin !== undefined) { // Ensures isAdmin is not undefined before proceeding
      setCategorizedSessions(categorizeSessions(sessions, isAdmin));
    }
  }, [sessions, isAdmin]); // Dependency array includes isAdmin to rerun when its value changes
  

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // const handleUpgradeClick = () => {
  //   setIsUpgradeModalOpen(true);
  //   if (isPaneOpen) {
  //     togglePane(); // Close the history pane
  //   }
  // };  

  const handleCloseUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
  };

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleDeleteAccount = () => {
    setIsConfirmDialogOpen(true);
    if (isPaneOpen) {
      togglePane(); // Close the history pane
    }
  };
  
  const handleConfirmDelete = async () => {
    try {
      const response = await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/user/delete`, { withCredentials: true });
      if (response.data.message === 'Account deleted successfully') {
        window.location.href = `${process.env.REACT_APP_FRONTEND_URL}/chat`;
      }
    } catch (error) {
      console.error('Error during account deletion:', error);
    } finally {
      setIsConfirmDialogOpen(false);
    }
  };

  useEffect(() => {
    function handleOutsideClickForDialog(event) {
      if (isConfirmDialogOpen && confirmDialogRef.current && !confirmDialogRef.current.contains(event.target)) {
        setIsConfirmDialogOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClickForDialog);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClickForDialog);
    };
  }, [isConfirmDialogOpen]);

  useEffect(() => {
    function handleOutsideClickForUpgradeModal(event) {
      if (isUpgradeModalOpen && upgradeModalRef.current && !upgradeModalRef.current.contains(event.target)) {
        setIsUpgradeModalOpen(false); // Close the upgrade modal
      }
    } 

    document.addEventListener('mousedown', handleOutsideClickForUpgradeModal);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClickForUpgradeModal);
    };
  }, [isUpgradeModalOpen]);

  const UpgradeModal = userCountry === 'India' ? UpgradePlanModalIndia : UpgradePlanModal;

  return (
    <div ref={paneRef}>
      <div className={`history-pane ${isPaneOpen ? '' : 'closed'}`}>

        <div onClick={handleNewSessionCreation} className="history-entry new-session-button">
          <span>GetBooks.ai</span> <i className="fa-regular fa-pen-to-square"></i>
        </div>
        
        <div className="history-content">
          {categorizedSessions.today.length > 0 && (
            <div>
              <div className="category-title">Today</div>
              {[...categorizedSessions.today].map((session, index) => (
                <div 
                  key={session._id} 
                  className={`history-entry ${selectedSessionId === session._id ? 'active' : ''}`} 
                  onClick={() => handleSessionSelect(session._id)}
                >
                  <div className="history-entry-text">
                    {session.sessionName}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session._id); }} className="delete-session-button">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          {categorizedSessions.yesterday.length > 0 && (
            <div>
              <div className="category-title">Yesterday</div>
              {[...categorizedSessions.yesterday].map((session, index) => (
                <div 
                  key={session._id} 
                  className={`history-entry ${selectedSessionId === session._id ? 'active' : ''}`} 
                  onClick={() => handleSessionSelect(session._id)}
                >
                  <div className="history-entry-text">
                    {session.sessionName}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session._id); }} className="delete-session-button">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          {categorizedSessions.last30Days.length > 0 && (
            <div>
              <div className="category-title">Previous 30 Days</div>
              {[...categorizedSessions.last30Days].map((session, index) => (
                <div 
                  key={session._id} 
                  className={`history-entry ${selectedSessionId === session._id ? 'active' : ''}`} 
                  onClick={() => handleSessionSelect(session._id)}
                >
                  <div className="history-entry-text">
                    {session.sessionName}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session._id); }} className="delete-session-button">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          {categorizedSessions.older.length > 0 && (
            <div>
              <div className="category-title">Older</div>
              {[...categorizedSessions.older].map((session, index) => (
                <div 
                  key={session._id} 
                  className={`history-entry ${selectedSessionId === session._id ? 'active' : ''}`} 
                  onClick={() => handleSessionSelect(session._id)}
                >
                  <div className="history-entry-text">
                    {session.sessionName}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session._id); }} className="delete-session-button">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="user-info-container">

          {
            userData && userData.id === process.env.REACT_APP_EXCLUDE_DUMMY_ID ? (
              <>
              <p className='history-pane-log-in-message'>Log in to save your conversation history</p>
              <div className={`user-entry-sign-in ${isEntryActive ? 'active' : ''}`} onClick={logInFunction}>
                <span>Log in</span>
              </div>
              </>
            ) : (
              <div className={`user-entry ${isEntryActive ? 'active' : ''}`} onClick={toggleDropdown} ref={userEntryRef}>
                <img src={getUserImage()} alt="" className="history-pane-image" />
                <span>{userName}</span>
              </div>
            )
          }

          {isDropdownOpen && (
            <ul className="dropdown-menu" ref={dropdownRef}>
              <li onClick={handleDeleteAccount}>
                <i className="fa-solid fa-trash"></i> Delete account
              </li>
              {/* <li onClick={handleUpgradeClick}>
                <i className="fa-solid fa-cart-shopping"></i> Upgrade Plan
              </li> */}
              <li onClick={() => navigate('/contact-us')} >
                <i className="fa-solid fa-address-book"></i> Contact us
              </li>
              <li onClick={handleLogout}>
                <i class="fa-solid fa-arrow-right-from-bracket"></i> Log out
              </li>
            </ul>   
          )}
        </div>
      </div> 

      <ConfirmationDialog 
        ref={confirmDialogRef}
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />
      
      <UpgradeModal
        ref={ref}
        isOpen={isUpgradeModalOpen}
        onClose={handleCloseUpgradeModal}
        userCountry={userCountry}
        userEmail={userEmail}
        userName={userName}
      />
    </div>
  );
});

export default HistoryPane;
