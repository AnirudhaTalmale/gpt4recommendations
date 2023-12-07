import React from 'react';
import '../App.css';

// HistoryPane.js
function HistoryPane({ sessions, onNewSession, onSelectSession, onDeleteSession }) {
  return (
    <div className="history-pane">
      <button onClick={onNewSession} className="new-session-button">
        Create New Chat Session
      </button>
      {sessions.map((session, index) => (
        <div key={session._id} className="history-entry">
          <div onClick={() => onSelectSession(index)}>
            <strong>{`Chat Session ${index + 1}`}</strong>
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
