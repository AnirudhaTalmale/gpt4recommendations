import React from 'react';
import '../App.css';

function HistoryPane({ sessions, onNewSession, onSelectSession, onDeleteSession }) {
  
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

  return (
    <div className="history-pane">
        <button onClick={handleNewSession} className="new-session-button">
            <i className="fa-regular fa-pen-to-square"></i>
        </button>
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
  );
}

export default HistoryPane;
