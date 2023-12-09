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

  useEffect(() => {
    console.log("Updated sessions state:", sessions);
    console.log("Updated currentSessionIndex state:", currentSessionIndex);
  }, [sessions, currentSessionIndex]);
  

  const loadSessions = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/sessions');
      setSessions(res.data);
      setCurrentSessionIndex(res.data.length - 1);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };
  
  

  const updateSessionMessages = (messageContent, contentType = 'simple', isUserMessage = true) => {
    setSessions(prevSessions => {
      const updatedSessions = [...prevSessions];
      const currentSession = { ...updatedSessions[currentSessionIndex] };
  
      const newMessage = {
        role: isUserMessage ? 'user' : 'assistant',
        contentType: contentType, // Use the passed contentType
        content: messageContent,
      };
  
      currentSession.messages = [...currentSession.messages, newMessage];
      updatedSessions[currentSessionIndex] = currentSession;
      return updatedSessions;
    });
  };

  const handleQuerySubmit = async (query) => {
    setIsLoading(true);
    updateSessionMessages(query, 'simple', true); // true for user message
  
    try {
      const response = await sendQuery(sessions[currentSessionIndex]._id, query);
      // Determine the contentType of the response
      const contentType = Array.isArray(response) ? 'bookRecommendation' : 'simple';
      updateSessionMessages(response, contentType, false); // false for assistant message
    } catch (error) {
      console.error('Error in handleQuerySubmit:', error);
      updateSessionMessages('Error fetching response.', 'simple', false); // false for assistant message
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
            
            return (
              <AnswerDisplay
                key={messageKey}
                role={msg.role}
                content={msg.content}
                contentType={msg.contentType} // Add this line
              />
            );
          })}
        </div>
      </div>
      <InputBox onSubmit={handleQuerySubmit} isLoading={isLoading} />
    </div>
  );
}

export default Chat;
