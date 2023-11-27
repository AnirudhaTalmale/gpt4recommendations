// Chat.js
import React, { useState } from 'react';
import InputBox from './InputBox';
import AnswerDisplay from './AnswerDisplay';
import HistoryPane from './HistoryPane';
import { sendQuery } from '../services/apiService';
import '../App.css';

function Chat() {
  const [sessions, setSessions] = useState([{ messages: [] }]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuerySubmit = async (query) => {
    setIsLoading(true);
    const messages = sessions[currentSessionIndex].messages.map(entry => ({ role: 'user', content: entry.query }));
    messages.push({ role: 'user', content: query });
    try {
      const response = await sendQuery(messages);
      const newMessage = { query, answer: response };
      // Append the new message to the current session
      const updatedSessions = [...sessions];
      updatedSessions[currentSessionIndex].messages.push(newMessage);
      setSessions(updatedSessions);
    } catch (error) {
      console.error('Frontend error:', error);
      // Append the error message to the current session
      const updatedSessions = [...sessions];
      updatedSessions[currentSessionIndex].messages.push({ query, answer: 'Sorry, an error occurred.' });
      setSessions(updatedSessions);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    // Check if the last session in the array is empty
    const lastSession = sessions[sessions.length - 1];
    if (lastSession.messages.length === 0) {
      // Don't create a new session if the last one is empty
      return;
    }
    
    // Add a new session to the sessions array
    const newSessions = [...sessions, { messages: [] }];
    setSessions(newSessions);
    // Update currentSessionIndex to the new session
    setCurrentSessionIndex(newSessions.length - 1);
  };

  const handleSelectSession = (index) => {
    setCurrentSessionIndex(index);
  };
  

  return (
    <div className="App">
      <HistoryPane
        sessions={sessions}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession} // Pass the new handler to HistoryPane
      />
      <div className="chat-container">
        <div className="chat-area">
          {sessions[currentSessionIndex].messages.map((entry, index) => (
            <AnswerDisplay key={index} question={entry.query} response={entry.answer} />
          ))}
        </div>
      </div>
      <InputBox onSubmit={handleQuerySubmit} isLoading={isLoading} />
    </div>
  );
}

export default Chat;