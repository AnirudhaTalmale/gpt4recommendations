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
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const updateSessionMessages = (message, isResponseUpdate = false) => {
    if (currentSessionIndex === -1) return;
  
    console.log('Updating session messages. Current session:', sessions[currentSessionIndex]);
    setSessions(prevSessions => {
      const updatedSessions = [...prevSessions];
      const currentSession = { ...updatedSessions[currentSessionIndex] };
  
      if (isResponseUpdate) {
        // Use a different identifier if _id is not structured as expected
        const messageIndex = currentSession.messages.findIndex(m => 
          m._id && m._id.$oid ? m._id.$oid === message.id : m.id === message.id
        );
        if (messageIndex !== -1) {
          currentSession.messages[messageIndex] = message;
        }
      } else {
        currentSession.messages.push(message);
      }
  
      updatedSessions[currentSessionIndex] = currentSession;
      console.log('Updated session:', currentSession);
      return updatedSessions;
    });
  };
  

  const handleQuerySubmit = async (query) => {
    setIsLoading(true);
    const messageID = Date.now();
    const newMessage = { id: messageID, role: 'user', content: query, response: 'Waiting for response...' };
    updateSessionMessages(newMessage);
  
    try {
      await sendQuery(sessions[currentSessionIndex]._id, query);
      await loadSessions(); // Reload sessions to fetch the updated messages including the response
    } catch (error) {
      console.error('Error in handleQuerySubmit:', error);
      updateSessionMessages({ id: messageID, response: 'Error fetching response.' }, true);
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

  function getMessageKey(msg, index) {
    // Check if the message has an _id field, and it's structured as expected
    if (msg && msg._id && typeof msg._id === 'object' && msg._id.$oid) {
      return msg._id.$oid;
    }
    // Handle messages without an _id field differently
    // For example, use a combination of the index and some unique property of the message
    // Here, I'm using the content of the message combined with the index as a fallback key
    return `temp-${index}-${msg.content}`;
  }

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
        {sessions[currentSessionIndex]?.messages.map((msg, index, messagesArray) => {
          // Check if the current message is from the user
          if (msg.role === 'user') {
            // Find the next assistant message to pair with this user message
            const nextAssistantMessageIndex = messagesArray.slice(index + 1).findIndex(m => m.role === 'assistant');
            const responseMessage = nextAssistantMessageIndex !== -1 ? messagesArray[index + 1 + nextAssistantMessageIndex] : null;
            
            const messageKey = getMessageKey(msg, index);


            return (
              <AnswerDisplay
                key={messageKey}
                question={msg.content}
                response={responseMessage ? responseMessage.content : "No response provided"}
              />
            );
          }
          // If the current message is from the assistant, we don't need to return anything since it will be included in the response for the user's message
          return null;
        }).filter(Boolean)}
        </div>
      </div>
      <InputBox onSubmit={handleQuerySubmit} isLoading={isLoading} />
    </div>
  );
}

export default Chat;
