import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputBox from './InputBox';
import AnswerDisplay from './AnswerDisplay';
import HistoryPane from './HistoryPane';
import '../App.css';
import { sendQuery } from '../services/apiService';

function Chat() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/sessions');
      setSessions(res.data);
      setCurrentSessionIndex(res.data.length - 1);

      // Log the messages from the latest session
      if (res.data.length > 0) {
        const latestSession = res.data[res.data.length - 1];
        console.log('Messages from the latest session:', latestSession.messages);
        // If you only want to log the response content
        // latestSession.messages.forEach((msg, index) => {
        //   if (msg.role === 'assistant') {
        //     console.log(`Response content for message ${index}:`, msg.content);
        //   }
        // });
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const updateSessionMessages = (newMessageContent, isResponseUpdate = false) => {
    setSessions(prevSessions => {
      // Clone the previous sessions array
      const updatedSessions = [...prevSessions];
      
      // Clone the current session object
      const currentSession = { ...updatedSessions[currentSessionIndex] };
      
      if (!isResponseUpdate) {
        // Add a new user message with a placeholder for the response
        const newMessage = {
          role: 'user',
          content: newMessageContent,
          response: 'Loading response...' // Placeholder for the response
        };
        currentSession.messages = [...currentSession.messages, newMessage];
      } else {
        // Find the index of the last user message that has 'Loading response...' as the response
        const lastUserMessageIndex = currentSession.messages
          .findLastIndex(m => m.role === 'user' && m.response === 'Loading response...');
        
        if (lastUserMessageIndex !== -1) {
          // Replace the placeholder with the actual response
          const updatedMessages = [...currentSession.messages];
          updatedMessages[lastUserMessageIndex].response = newMessageContent;
          currentSession.messages = updatedMessages;
        }
      }
      
      // Replace the current session with the updated one
      updatedSessions[currentSessionIndex] = currentSession;
      
      return updatedSessions;
    });
  };
  
  const handleQuerySubmit = async (query) => {
    setIsLoading(true);
    updateSessionMessages(query);

    try {
      const response = await sendQuery(sessions[currentSessionIndex]._id, query);
      // Update the response directly for immediate display
      updateSessionMessages(response, true);
    } catch (error) {
      console.error('Error in handleQuerySubmit:', error);
      updateSessionMessages('Error fetching response.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/session');
      setSessions(prevSessions => [...prevSessions, res.data]);
      setCurrentSessionIndex(sessions.length);
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await axios.delete(`http://localhost:3000/api/session/${sessionId}`);
      setSessions(prevSessions => prevSessions.filter(session => session._id !== sessionId));
      setCurrentSessionIndex(prevIndex => (prevIndex === 0 ? -1 : prevIndex - 1));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  return (
    <div className="App">
      <HistoryPane
        sessions={sessions}
        onNewSession={handleNewSession}
        onSelectSession={setCurrentSessionIndex}
        onDeleteSession={handleDeleteSession}
      />
      <div className="chat-container">
        <div className="chat-area">
          {sessions[currentSessionIndex]?.messages.map((msg, index) => {
            // Generate a key using MongoDB's _id
            const messageKey = msg._id ? msg._id.$oid : `temp-${index}`;

            // Check if the current message is from the user and display it along with its response
            if (msg.role === 'user') {
              return (
                <AnswerDisplay
                  key={messageKey}
                  question={msg.content}
                  response={msg.response || "Waiting for response..."}
                />
              );
            }
            // If the current message is from the assistant, we don't need to return anything
            // since it will be included in the response for the user's message
            return null;
          }).filter(Boolean)}
        </div>
      </div>
      <InputBox onSubmit={handleQuerySubmit} isLoading={isLoading} />
    </div>
  );
}

export default Chat;
