import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputBox from './InputBox';
import AnswerDisplay from './AnswerDisplay';
import HistoryPane from './HistoryPane';
import { sendQuery } from '../services/apiService';
import '../App.css';

function Chat() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('Component did mount, loading sessions.');
    const loadSessions = async () => {
      try {
        console.log('Making API call to retrieve sessions.');
        const res = await axios.get('http://localhost:3000/api/sessions');
        console.log('Sessions retrieved:', res.data);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setSessions(res.data);
          setCurrentSessionIndex(res.data.length - 1);
          console.log('Sessions state set with data:', res.data);
        } else {
          setSessions([]);
          setCurrentSessionIndex(-1);
          console.log('No sessions found, initialized state to empty.');
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        setSessions([]);
        setCurrentSessionIndex(-1);
      }
    };

    loadSessions();
  }, []);

  const updateCurrentSession = (message) => {
    setSessions(prevSessions => {
      const updatedSessions = [...prevSessions];
      if (currentSessionIndex !== -1) {
        // Clone the current session to avoid direct state mutation
        const currentSession = { ...updatedSessions[currentSessionIndex] };
        // Clone the messages array
        currentSession.messages = [...currentSession.messages, message];
        // Update the session
        updatedSessions[currentSessionIndex] = currentSession;
      }
      return updatedSessions;
    });
  };
  
  const updateMessageInCurrentSession = (messageID, response) => {
    setSessions(prevSessions => {
      const updatedSessions = [...prevSessions];
      if (currentSessionIndex !== -1) {
        // Clone the current session to avoid direct state mutation
        const currentSession = { ...updatedSessions[currentSessionIndex] };
        // Find the message index
        const messageIndex = currentSession.messages.findIndex(m => m.id === messageID);
        if (messageIndex !== -1) {
          // Clone the message to avoid direct state mutation
          const updatedMessage = { ...currentSession.messages[messageIndex], response };
          // Update the message in the cloned messages array
          currentSession.messages[messageIndex] = updatedMessage;
        }
        // Update the session
        updatedSessions[currentSessionIndex] = currentSession;
      }
      return updatedSessions;
    });
  };
  
  

  const handleQuerySubmit = async (query) => {
    setIsLoading(true);
    
    const messageID = Date.now(); // Using the current timestamp as a simple unique identifier
    const newMessage = { id: messageID, role: 'user', content: query, response: 'Waiting for response...' };
    updateCurrentSession(newMessage);
    
    if (sessions[currentSessionIndex]) {
      const currentSessionId = sessions[currentSessionIndex]._id;
    
      try {
        // Pass only the necessary data to the backend
        const response = await sendQuery(currentSessionId, query);
        updateMessageInCurrentSession(messageID, response || 'No response received.');
      } catch (error) {
        console.error('Error in handleQuerySubmit:', error);
        updateMessageInCurrentSession(messageID, 'Error fetching response.');
      } finally {
        setIsLoading(false);
      }
    } else {
      console.error('Current session is undefined. Unable to save the message.');
      setIsLoading(false);
    }
  };
  

  const handleNewSession = async () => {
    console.log('Creating a new session.');
    const lastSession = sessions[sessions.length - 1];
    if (lastSession && lastSession.messages.length === 0) {
      return;
    }
    try {
      const res = await axios.post('http://localhost:3000/api/session');
      const newSession = res.data;
      setSessions(prevSessions => {
        const newSessions = [...prevSessions, newSession];
        setCurrentSessionIndex(newSessions.length - 1);
        return newSessions;
      });
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const handleSelectSession = (index) => {
    console.log(`Session selected with index: ${index}, session ID: ${sessions[index]?._id}`);
    setCurrentSessionIndex(index);
  };

  return (
    <div className="App">
      <HistoryPane
        sessions={sessions}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
      />
      <div className="chat-container">
        <div className="chat-area">
          {sessions[currentSessionIndex]?.messages.map((msg, index) => (
            <AnswerDisplay key={`msg-${index}`} question={msg.content} response={msg.response} />
          ))}
        </div>
      </div>
      <InputBox onSubmit={handleQuerySubmit} isLoading={isLoading} />
    </div>
  );
}

export default Chat;
