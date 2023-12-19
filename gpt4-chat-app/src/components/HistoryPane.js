import React, { useState } from 'react';
import '../App.css';

function HistoryPane({ sessions, onNewSession, onSelectSession, onDeleteSession }) {
  const [isPaneOpen, setIsPaneOpen] = useState(true);

  // Custom function to handle new session creation
  const handleNewSession = () => {
    if (sessions.length > 0 && isSessionEmpty(sessions[sessions.length - 1])) {
      onSelectSession(sessions.length - 1);
    } else {
      onNewSession();
    }
  };

  const isSessionEmpty = (session) => {
    return session.messages.length === 0;
  };

  // Add a function to handle the close action
  const handleClosePane = () => {
    setIsPaneOpen(!isPaneOpen);
    console.log('Close pane clicked');
  };

  return (
    <div>
      <div className="pane-toggle-button">
      <button onClick={handleClosePane} className={`close-pane-button ${!isPaneOpen ? 'close-pane-button-closed' : ''}`}>
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>

      <div className={`history-pane ${isPaneOpen ? '' : 'closed'}`}>
        {/* <div className="top-button-container"> */}
          <button onClick={handleNewSession} className="new-session-button">
            <i className="fa-regular fa-pen-to-square"></i>
          </button>
        {/* </div> */}
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
    </div>
  );
}

export default HistoryPane;
