import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import InputBox from './InputBox';
import AnswerDisplay from './AnswerDisplay';
import HistoryPane from './HistoryPane';
import '../App.css';
// import { sendQuery } from '../services/apiService';
import socket from './socket';

function Chat() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);


  const loadSessions = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/sessions');
      setSessions(res.data);
      
      // setCurrentSessionIndex(res.data.length - 1);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, []); // Add dependencies if there are any

  useEffect(() => {
    // Load sessions from the server
    loadSessions();
  }, [loadSessions]);
  
  useEffect(() => {
    // Save the current session index to localStorage whenever it changes
    if (currentSessionIndex !== -1) {
      localStorage.setItem('currentSessionIndex', currentSessionIndex);
    }
  }, [currentSessionIndex]);
  
  useEffect(() => {
    // Retrieve the current session index from localStorage when the component mounts
    const savedSessionIndex = localStorage.getItem('currentSessionIndex');
    if (savedSessionIndex) {
      setCurrentSessionIndex(parseInt(savedSessionIndex, 10));
    } else {
      // If there is no saved index, load the latest session
      setCurrentSessionIndex(sessions.length - 1);
    }
  }, [sessions.length]);
  
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/check-auth', { withCredentials: true });
      if (response.status === 200 && response.data.isAuthenticated) {
        // Fetch user data
        const userInfoResponse = await axios.get('http://localhost:3000/api/user-info', { withCredentials: true });
        if (userInfoResponse.status === 200 && userInfoResponse.data.isAuthenticated) {
          setUserData(userInfoResponse.data.user);
        }
      } else {
        window.location.href = 'http://localhost:3001/auth/login';
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      window.location.href = 'http://localhost:3001/auth/login';
    }
  }, []);
  

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  
  const updateSessionMessages = useCallback((messageContent, contentType = 'simple', isUserMessage = true) => {
    setSessions(prevSessions => {
      // Clone the previous sessions array
      const updatedSessions = [...prevSessions];
      // Clone the current session
      const currentSession = { ...updatedSessions[currentSessionIndex] };

      // Handle the case for streamed content for the assistant's messages
      if (contentType === 'streamed' && !isUserMessage) {
        // Clone the messages array from the current session
        let updatedMessages = [...currentSession.messages];
        const lastMessageIndex = updatedMessages.length - 1;
  
        if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].role === 'assistant') {
          // Create a new message object with the concatenated content
          updatedMessages[lastMessageIndex] = {
            ...updatedMessages[lastMessageIndex],
            content: updatedMessages[lastMessageIndex].content + messageContent,
          };
        } else {
          // Append a new message object to the cloned messages array
          updatedMessages.push({ role: 'assistant', contentType, content: messageContent });
        }
  
        // Set the updated messages array back to the current session
        currentSession.messages = updatedMessages;
      } else {
        // Handle the user's message or a non-streamed assistant's message
        const newMessage = {
          role: isUserMessage ? 'user' : 'assistant',
          contentType,
          content: messageContent,
        };
        // Append the new message to the cloned messages array
        currentSession.messages = [...currentSession.messages, newMessage];
      }
      
      // Update the current session in the sessions array
      updatedSessions[currentSessionIndex] = currentSession;
      // Return the new sessions array to update the state
      return updatedSessions;
    });
  }, [currentSessionIndex]); // Add dependencies if there are any

  useEffect(() => {
    loadSessions();

    socket.on('chunk', (chunk) => {
      updateSessionMessages(chunk, 'streamed', false);
    });

    return () => {
      socket.off('chunk');
    };
  }, [loadSessions, updateSessionMessages]); // Include the functions in the dependency array

  const handleQuerySubmit = async (query) => {
    setIsLoading(true);
    updateSessionMessages(query, 'simple', true); // true for user message
  
    // Emit the query to the server
    socket.emit('query', {
      sessionId: sessions[currentSessionIndex]._id,
      message: {
        role: 'user',
        content: query,
      }
    });
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
      <div className="chat-area">
      {sessions[currentSessionIndex]?.messages.map((msg, index) => {
        const messageKey = msg._id ? msg._id.$oid : `temp-${index}`;
        return (
          <AnswerDisplay
            key={messageKey}
            role={msg.role}
            content={msg.content}
            contentType={msg.contentType}
            userImage={userData?.image}// Passing the user data as a prop
          />
        );
      })}
      </div>
      <InputBox onSubmit={handleQuerySubmit} isLoading={isLoading} />
    </div>
  );
}

export default Chat;