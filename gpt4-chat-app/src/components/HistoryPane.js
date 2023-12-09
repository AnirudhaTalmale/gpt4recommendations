import React from 'react';
import '../App.css';

function HistoryPane({ sessions, onNewSession, onSelectSession, onDeleteSession }) {
  
  // Custom function to handle new session creation
  const handleNewSession = () => {
    // Check if there are no sessions or the last session is not empty
    if (sessions.length === 0 || !isSessionEmpty(sessions[sessions.length - 1])) {
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
        New Chat
      </button>
      {[...sessions].reverse().map((session, index) => (
        <div key={session._id} className="history-entry">
          <div onClick={() => onSelectSession(sessions.length - 1 - index)}>
            <strong>{`Chat Session ${sessions.length - index}`}</strong>
          </div>
          <button onClick={() => onDeleteSession(session._id)} className="delete-session-button">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default HistoryPane;

