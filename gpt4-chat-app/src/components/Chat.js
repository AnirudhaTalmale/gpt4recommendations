import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import InputBox from './InputBox';
import AnswerDisplay from './AnswerDisplay';
import HistoryPane from './HistoryPane';
import '../App.css';
import socket from './socket';
import Header from './Header';


function Chat() {
  const [sessions, setSessions] = useState([]);
  const [isPaneOpen, setIsPaneOpen] = useState(window.innerWidth >= 760 ? true : false);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const historyPaneRef = useRef(null);

  const chatAreaRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const togglePane = () => {
    setIsPaneOpen(!isPaneOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 760) {
        setIsPaneOpen(false); // Close the pane for smaller screens
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isUserAtBottom = () => {
    if (!chatAreaRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
    // Considered at bottom if within 100px of the bottom
    return scrollTop + clientHeight >= scrollHeight - 5;
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    }, 0.001); // Adjust the timeout duration if needed
  };
  
  useEffect(() => {
    if (isInitialLoad || currentSessionIndex !== -1) {
      scrollToBottom();
    }
  }, [currentSessionIndex, isInitialLoad]);
  
  
  useEffect(() => {
    const handleScroll = () => {
      setShouldAutoScroll(isUserAtBottom());
    };

    const chatArea = chatAreaRef.current;
    chatArea.addEventListener('scroll', handleScroll);

    return () => {
      chatArea.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const messages = sessions[currentSessionIndex]?.messages;
  
    // Ensure there are messages before accessing the last message
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
  
      if (shouldAutoScroll && lastMessage && lastMessage.contentType === 'streamed') {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    }
  }, [sessions[currentSessionIndex]?.messages, shouldAutoScroll]);
  
  
  const loadSessions = useCallback(async (currentUserData) => {
    console.log('loadSessions called with:', currentUserData);
    // Check if currentUserData.id is used instead of currentUserData.id
    if (!currentUserData || !currentUserData.id) { // Changed from !_id to .id
      console.log('User data or ID not available.');
      return;
    }
    
    try {
      // Adjust the params to use currentUserData.id as well
      const res = await axios.get('http://localhost:3000/api/sessions', { params: { userId: currentUserData.id } }); // Changed from _id to .id
      setSessions(res.data);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, []);

  
  
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
      const authResponse = await axios.get('http://localhost:3000/api/check-auth', { withCredentials: true });
      console.log('Auth response:', authResponse.data); // New log
  
      if (authResponse.status === 200 && authResponse.data.isAuthenticated) {
        const userInfoResponse = await axios.get('http://localhost:3000/api/user-info', { withCredentials: true });
        console.log('User info response:', userInfoResponse.data); // New log
  
        if (userInfoResponse.status === 200 && userInfoResponse.data.isAuthenticated) {
          const currentUserData = userInfoResponse.data.user;
          console.log('Frontend received user data:', currentUserData);
          setUserData(currentUserData);
          loadSessions(currentUserData);
        }
      } else {
        window.location.href = 'http://localhost:3001/auth/login';
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      window.location.href = 'http://localhost:3001/auth/login';
    }
  }, [loadSessions]);
  

    
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const updateSessionName = useCallback(({ sessionId, sessionName }) => {
    setSessions(prevSessions => prevSessions.map(session => 
      session._id === sessionId ? { ...session, sessionName } : session
    ));
  }, []);  

  useEffect(() => {
    socket.on('updateSessionName', updateSessionName);
  
    return () => {
      socket.off('updateSessionName', updateSessionName);
    };
  }, [updateSessionName]);
  
  
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

  const handleStopStreaming = useCallback(async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/stop-stream');
      console.log(response.data.message); // Log the response message
      setIsStreaming(false);
    } catch (error) {
      console.error('Error stopping the stream:', error);
    }
  }, []);

  useEffect(() => {
    // Listen for the 'streamEnd' event from the socket
    const handleStreamEnd = ({ message, sessionId }) => {
      if (sessions[currentSessionIndex]._id === sessionId) {
        setIsStreaming(false);
      }
    };
  
    socket.on('streamEnd', handleStreamEnd);
  
    return () => {
      // Cleanup: remove the listener when the component unmounts
      socket.off('streamEnd', handleStreamEnd);
    };
  }, [handleStopStreaming, currentSessionIndex, sessions]);

  useEffect(() => {
  
    let streamTimeout;
  
    const handleStreamChunk = ({ content, sessionId }) => {
      if (sessions[currentSessionIndex]._id === sessionId) {
        updateSessionMessages(content, 'streamed', false);
        setIsStreaming(true); // Set streaming to true on receiving a chunk
    
        // Clear any existing timeout
        clearTimeout(streamTimeout);
    
        // Set a new timeout to invoke handleStopStreaming after a period of inactivity
        streamTimeout = setTimeout(() => {
          handleStopStreaming();
        }, 7000); // 7 seconds
      }
    };
  
    socket.on('chunk', handleStreamChunk);
  
    return () => {
      socket.off('chunk', handleStreamChunk);
      clearTimeout(streamTimeout); // Clear the timeout when the component is unmounted
    };
  }, [updateSessionMessages, handleStopStreaming, currentSessionIndex, sessions]); // Depend on the memoized version of handleStopStreaming
  

  const handleQuerySubmit = async (query) => {
    setIsLoading(true);
    const isFirstQuery = sessions[currentSessionIndex]?.messages?.length === 0;
    updateSessionMessages(query, 'simple', true); // true for user message
  
    // Emit the query to the server
    socket.emit('query', {
      sessionId: sessions[currentSessionIndex]._id,
      message: {
        role: 'user',
        content: query,
        isFirstQuery 
      }
    });
  };  

  const isSessionEmpty = (session) => {
    return session.messages.length === 0;
  };

  const handleNewSession = async () => {
    if (sessions.length > 0 && isSessionEmpty(sessions[sessions.length - 1])) {
      setCurrentSessionIndex(sessions.length - 1);
    } else {
      try {
        if (!userData) return;
        const res = await axios.post('http://localhost:3000/api/session', { userId: userData.id });
        setSessions(prevSessions => [...prevSessions, res.data]);
        setCurrentSessionIndex(sessions.length);
      } catch (error) {
        console.error('Error creating new session:', error);
      }
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

  const setCurrentSessionIndexWithStreamCheck = newIndex => {
    if (currentSessionIndex !== newIndex && isStreaming) {
      handleStopStreaming(); // Stop streaming if it's active and session changes
    }
    setCurrentSessionIndex(newIndex);
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isStreaming) {
        handleStopStreaming();
      }
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isStreaming, handleStopStreaming]);

  const handleMoreDetailsRequest = (userQuery) => {
    handleQuerySubmit(userQuery);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (historyPaneRef.current && !historyPaneRef.current.contains(event.target)) {
        // Check if the screen is less than 760px and the pane is open
        if (window.innerWidth < 760 && isPaneOpen) {
          togglePane();
        }
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPaneOpen, togglePane]);
  
  

  return (
    <div className="App">

      <HistoryPane
        ref={historyPaneRef}
        sessions={sessions}
        onNewSession={handleNewSession}
        onSelectSession={setCurrentSessionIndexWithStreamCheck}
        onDeleteSession={handleDeleteSession}
        userName={userData?.name}
        userImage={userData?.image}
        isPaneOpen={isPaneOpen}
        togglePane={togglePane}
      />
      <Header isPaneOpen={isPaneOpen} onNewSession={handleNewSession} togglePane={togglePane} />
      <div className="chat-area" ref={chatAreaRef}>
        
        {sessions[currentSessionIndex] && sessions[currentSessionIndex].messages.length === 0 && (
          <div className="chat-heading">
            Discover Your Next Great Read!
          </div>
        )}
        {sessions[currentSessionIndex]?.messages.map((msg, index) => {
          const messageKey = msg._id ? msg._id.$oid : `temp-${index}`;
          return (
            <AnswerDisplay
              key={messageKey}
              role={msg.role}
              content={msg.content}
              contentType={msg.contentType}
              userImage={userData?.image}
              isStreaming={isStreaming}
              onMoreDetailsClick={handleMoreDetailsRequest}
            />
          );
        })}
      </div>
      <InputBox onSubmit={handleQuerySubmit} isLoading={isLoading} isStreaming={isStreaming} onStopStreaming={handleStopStreaming} />
    </div>
  );
}

export default Chat;