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
    // Load sessions from the backend when the component mounts
    const loadSessions = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/sessions');
        // Check if res.data is an array and has length before updating the state
        if (Array.isArray(res.data) && res.data.length > 0) {
          setSessions(res.data);
          setCurrentSessionIndex(res.data.length - 1); // Last session is the current session
        } else {
          // If no sessions are returned, initialize with an empty array and index as -1
          setSessions([]);
          setCurrentSessionIndex(-1);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        // Even in case of an error, we can initialize with an empty array and index as -1
        setSessions([]);
        setCurrentSessionIndex(-1);
      }
    };
  
    loadSessions();
  }, []);
  
  const currentSessionMessages = (currentSessionIndex !== -1 && sessions[currentSessionIndex]?.messages) ? sessions[currentSessionIndex].messages.filter(msg => msg != null) : [];

  const handleQuerySubmit = async (query) => {
    console.log('Submitting query:', query); // Log the query being submitted
    setIsLoading(true);
    if (sessions[currentSessionIndex]) {
      const currentSessionId = sessions[currentSessionIndex]._id;
      try {
        const response = await sendQuery(query);
        console.log('Received response from sendQuery:', response); // Log the response received
        if (response) {
          const newMessage = { query, response }; 
          console.log('Sending newMessage to session:', newMessage); // Log the message being sent
          const postResponse = await axios.post(`http://localhost:3000/api/session/${currentSessionId}/message`, newMessage);
          console.log('Response from posting message to session:', postResponse.data); // Log the response from the backend after posting the message
          const updatedSessions = [...sessions];
          updatedSessions[currentSessionIndex].messages.push(newMessage);
          setSessions(updatedSessions);
        } else {
          console.error('No response received from OpenAI.');
        }
      } catch (error) {
        console.error('Error sending query or saving message:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.error('Current session is undefined. Unable to save the message.');
      setIsLoading(false);
    }
  };

  const handleNewSession = async () => {
    const lastSession = sessions[sessions.length - 1];
    if (lastSession && lastSession.messages.length === 0) {
      // Avoid creating a new session if the last one is empty
      return;
    }
    try {
      const res = await axios.post('http://localhost:3000/api/session');
      const newSession = res.data;
      setSessions(prevSessions => {
        const newSessions = [...prevSessions, newSession];
        setCurrentSessionIndex(newSessions.length - 1); // Index of the new session
        return newSessions;
      });
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const handleSelectSession = (index) => {
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
          {currentSessionMessages.map((entry, index) => {
            // Ensure that entry is not null before trying to access its properties
            if (entry) {
              // Use entry.response instead of entry.answer
              return <AnswerDisplay key={index} question={entry.query} response={entry.response} />;
            }
            return null; // or you could return a placeholder component for missing messages
          })}
        </div>
      </div>
      <InputBox onSubmit={handleQuerySubmit} isLoading={isLoading} />
    </div>
  );
}

export default Chat;
