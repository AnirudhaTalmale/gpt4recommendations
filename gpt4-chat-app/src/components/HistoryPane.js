import React from 'react';
import '../App.css';

// HistoryPane.js
// HistoryPane.js
function HistoryPane({ sessions, onNewSession, onSelectSession }) {
  return (
    <div className="history-pane">
      <button onClick={onNewSession} className="new-session-button">
        Create New Chat Session
      </button>
      {sessions.map((session, index) => (
        <div key={index} className="history-entry" onClick={() => onSelectSession(index)}>
          <strong>{`Chat Session ${index + 1}`}</strong>
        </div>
      ))}
    </div>
  );
}

export default HistoryPane;