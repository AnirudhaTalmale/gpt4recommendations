import React from 'react';
import '../App.css';

function HistoryPane({ sessions, onNewSession, onSelectSession, onDeleteSession }) {
  
  // Custom function to handle new session creation
  const handleNewSession = () => {
    // Check if the last session is empty
    if (sessions.length > 0 && isSessionEmpty(sessions[sessions.length - 1])) {
      // Switch to the last (newest) session if it's empty
      onSelectSession(sessions.length - 1);
    } else {
      // Otherwise, create a new session
      onNewSession();
    }
  };


  // Helper function to determine if a session is empty
  // You need to define how to determine if a session is empty based on your data structure
  const isSessionEmpty = (session) => {
    // Example check, you should replace this with your actual logic
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
                    {`Chat Session ${sessions.length - index}`}
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

