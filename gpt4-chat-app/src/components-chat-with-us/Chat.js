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
  const historyPaneRef = useRef(null);
  const [unseenMessageCounts, setUnseenMessageCounts] = useState({});


  const chatAreaRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(userData?.role === 'assistant');
  }, [userData]);
  
  const togglePane = useCallback(() => {
    setIsPaneOpen(prevIsPaneOpen => !prevIsPaneOpen);
  }, []);  

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

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    }, 1); // Adjust the timeout duration if needed
  }, [chatAreaRef]); // Dependency on chatAreaRef
  
  
  useEffect(() => {
    if (isInitialLoad || currentSessionIndex !== -1) {
      scrollToBottom();
    }
  }, [currentSessionIndex, isInitialLoad, scrollToBottom]);
  
  
  useEffect(() => {
    const handleScroll = () => {
      const atBottom = isUserAtBottom();
      setShouldAutoScroll(atBottom);
  
      if (atBottom && userData) {
        const currentSession = sessions[currentSessionIndex];
        if (currentSession && unseenMessageCounts[currentSession._id] > 0) {
          // Emit the socket event with sessionId and userId
          socket.emit('reset-unseen-count', {
            sessionId: currentSession._id, 
            userId: userData.id // Use userData.id only if userData is not null
          });
  
          // Optionally, update the local state to reset the count
          setUnseenMessageCounts(prevCounts => ({
            ...prevCounts,
            [currentSession._id]: 0
          }));
        }
      }
    };
  
    const chatArea = chatAreaRef.current;
    if (chatArea) {
      chatArea.addEventListener('scroll', handleScroll);
    }
  
    return () => {
      if (chatArea) {
        chatArea.removeEventListener('scroll', handleScroll);
      }
    };
  }, [sessions, currentSessionIndex, unseenMessageCounts, userData]); // Update the dependency array
  


  // Extract the complex expression to a variable
  const currentSessionMessages = currentSessionIndex >= 0 ? sessions[currentSessionIndex]?.messages : null;

  useEffect(() => {
    // Ensure there are messages before accessing the last message
    if (currentSessionMessages && currentSessionMessages.length > 0) {
      const lastMessage = currentSessionMessages[currentSessionMessages.length - 1];

      if (shouldAutoScroll && lastMessage && lastMessage.contentType === 'simple') {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    }
  }, [currentSessionMessages, shouldAutoScroll]); // Use the extracted variable as a dependency

  const fetchReceiverIdByEmail = async (email) => {
    try {
      const response = await axios.get('http://localhost:3000/api/get-user-by-email', {
        params: { email: email }
      });
      return response.data._id; // Assuming the user object is returned directly
    } catch (error) {
      console.error('Error fetching receiver ID:', error);
      return null; // Handle error appropriately
    }
  };  
  
  const loadSessions = useCallback(async (currentUserData) => {
    if (!currentUserData || !currentUserData.id) { 
      console.log('User data or ID not available.');
      return;
    }
    
    try {
      const res = await axios.get('http://localhost:3000/api/chat-with-us-sessions', {
        params: {
          userId: currentUserData.id,
          role: isAdmin ? 'assistant' : 'user'
        }
      });
  
      const sessionsWithCounts = res.data.map(session => {
        return {
          ...session,
          unseenCount: session.unseenCount || 0 // Assuming API returns unseenCount
        };
      });
  
      setSessions(sessionsWithCounts);
      setIsInitialLoad(false);
  
      // Update unseen message counts
      const newUnseenMessageCounts = {};
      sessionsWithCounts.forEach(session => {
        newUnseenMessageCounts[session._id] = session.unseenCount;
      });
      setUnseenMessageCounts(newUnseenMessageCounts);

      sessionsWithCounts.forEach(session => {
        socket.emit('join-chat-session', session._id);
      });
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, [isAdmin]);
  
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
  
      if (authResponse.status === 200 && authResponse.data.isAuthenticated) {
        const userInfoResponse = await axios.get('http://localhost:3000/api/user-info', { withCredentials: true });
  
        if (userInfoResponse.status === 200 && userInfoResponse.data.isAuthenticated) {
          const currentUserData = userInfoResponse.data.user;
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
  
  
  const updateSessionMessages = useCallback((messageContent, contentType = 'simple', isUserMessage = true, base64Attachments = [], timestamp) => {
    setSessions(prevSessions => {
      // Clone the previous sessions array
      const updatedSessions = [...prevSessions];
      // Clone the current session
      const currentSession = { ...updatedSessions[currentSessionIndex] };
  
      const newMessage = {
        role: isUserMessage ? (isAdmin ? 'assistant' : 'user') : 'assistant',
        contentType,
        content: messageContent,
        attachments: base64Attachments, // Include attachments
        timestamp: timestamp // Include timestamp
      };
      // Append the new message to the cloned messages array
      currentSession.messages = [...currentSession.messages, newMessage];
  
      // Update the current session in the sessions array
      updatedSessions[currentSessionIndex] = currentSession;
  
      // Scroll to bottom after message update
      scrollToBottom();
  
      // Return the new sessions array to update the state
      return updatedSessions;
    });
  }, [currentSessionIndex, scrollToBottom, isAdmin]);

  useEffect(() => {
    const handleChatWithUsUpdate = (data) => {
      console.log('Received chat-with-us update:', data);
      if (data.sessionId === sessions[currentSessionIndex]?._id) {
        // Update the session with the new message and attachments
        setSessions(sessions => sessions.map(session => {
          if (session._id === data.sessionId) {
            return {
              ...session,
              messages: [...session.messages, {
                ...data.message,
                attachments: data.message.attachments,
                timestamp: data.message.timestamp
              }]
            };
          }
          return session;
        }));
        if (shouldAutoScroll) {
          scrollToBottom();
        }
      }
    };
  
    socket.on('chat-with-us-update', handleChatWithUsUpdate);
  
    return () => {
      socket.off('chat-with-us-update', handleChatWithUsUpdate);
    };
  }, [currentSessionIndex, sessions, shouldAutoScroll, scrollToBottom]);
  
  useEffect(() => {
    const handleChatWithUsResponse = (data) => {
      console.log('Received chat-with-us response:', data);
      if (data.sessionId === sessions[currentSessionIndex]?._id) {
        // Update the session with the new message and attachments
        setSessions(sessions => sessions.map(session => {
          if (session._id === data.sessionId) {
            return {
              ...session,
              messages: [...session.messages, {
                ...data.message,
                attachments: data.message.attachments,
                timestamp: data.message.timestamp
              }]
            };
          }
          return session;
        }));
        if (shouldAutoScroll) {
          scrollToBottom();
        }
      }
    };
  
    socket.on('chat-with-us-response', handleChatWithUsResponse);
  
    return () => {
      socket.off('chat-with-us-response', handleChatWithUsResponse);
    };
  }, [currentSessionIndex, sessions, shouldAutoScroll, scrollToBottom]);


  const handleQuerySubmit = async (formData) => {
    setIsLoading(true);

    if (!(formData instanceof FormData)) {
      formData = new FormData();
      formData.append('text', formData);
    }

    const textQuery = formData.get('text');
    const attachments = formData.getAll('attachments');
    const base64Attachments = await Promise.all(attachments.map(file => convertToBase64(file)));
    const timestamp = new Date().toISOString();

    updateSessionMessages(textQuery, 'simple', true, base64Attachments, timestamp);
  
    const eventType = isAdmin ? 'chat-with-us-response' : 'chat-with-us-query';
    socket.emit(eventType, {
      sessionId: sessions[currentSessionIndex]._id,
      userId: userData.id,  // Include the userId here
      message: {
        role: isAdmin ? 'assistant' : 'user',
        content: textQuery,
        timestamp: timestamp,
        isFirstQuery: sessions[currentSessionIndex]?.messages?.length === 0
      },
      attachments: base64Attachments
    });    
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
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
        const receiverId = await fetchReceiverIdByEmail('anirudhatalmale4@gmail.com');
        if (!receiverId) {
          console.error('Receiver ID not found');
          return;
        }
        const res = await axios.post('http://localhost:3000/api/chat-with-us-session', {
          userId: userData.id,
          receiverId: receiverId
        });
        setSessions(prevSessions => [...prevSessions, res.data]);
        setCurrentSessionIndex(sessions.length);
      } catch (error) {
        console.error('Error creating new session:', error);
      }
    }
  };  

  useEffect(() => {
    const handleNewSession = (newSession, receiverId) => {
      // Check if the current user's ID matches the receiver ID
      if (userData.id === receiverId) {
        setSessions(prevSessions => [...prevSessions, newSession]);
      }
    };
  
    socket.on('new-session', handleNewSession);
  
    return () => {
      socket.off('new-session', handleNewSession);
    };
  }, [userData]);  

  useEffect(() => {
    const handleDeleteSession = (deletedSessionId, receiverId) => {
      if (userData.id === receiverId) {
        setSessions(prevSessions => prevSessions.filter(session => session._id !== deletedSessionId));
      }
    };
  
    socket.on('delete-session', handleDeleteSession);
  
    return () => {
      socket.off('delete-session', handleDeleteSession);
    };
  }, [userData]);
  

  
  const handleDeleteSession = async (sessionId) => {
    try {
      if (!userData || !userData.id) {
        console.error('User data or ID not available.');
        return;
      }
  
      await axios.delete(`http://localhost:3000/api/chat-with-us-session/${sessionId}`, {
        data: { userId: userData.id } // Passing userId in the body of DELETE request
      });
  
      setSessions(prevSessions => prevSessions.filter(session => session._id !== sessionId));
      setCurrentSessionIndex(prevIndex => (prevIndex === 0 ? -1 : prevIndex - 1));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };  

  const setCurrentSessionIndexWithStreamCheck = newIndex => {
    setCurrentSessionIndex(newIndex);
  };  

  const handleSessionSelectAndUpdate = async (sessionId) => {
    socket.emit('request-session-state', sessionId); // Emit event to request session state
    setCurrentSessionIndexWithStreamCheck(sessions.findIndex(session => session._id === sessionId));
  } ;


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

  useEffect(() => {
    const handleUnseenMessageCount = (data) => {
      if (data.userId === userData.id) { // Check if the update is for the current user
        setUnseenMessageCounts(prevCounts => ({
          ...prevCounts,
          [data.sessionId]: data.count
        }));
      }
    };
  
    socket.on('unseen-message-count', handleUnseenMessageCount);
  
    return () => {
      socket.off('unseen-message-count', handleUnseenMessageCount);
    };
  }, [userData]); 
  

  const resetUnseenCount = (sessionId) => {
    setUnseenMessageCounts(prevCounts => ({
      ...prevCounts,
      [sessionId]: 0
    }));
  };

  useEffect(() => {
    socket.on('session-state', (updatedSession) => {
      setSessions(prevSessions => {
        return prevSessions.map(session => session._id === updatedSession._id ? updatedSession : session);
      });
      scrollToBottom(); // Optional: Scroll to the bottom of the chat area
    });
  
    return () => {
      socket.off('session-state');
    };
  }, [scrollToBottom]);

  useEffect(() => {
    const checkScrollbarAndResetUnseenCount = () => {
      const chatArea = chatAreaRef.current;
      if (chatArea && currentSessionIndex >= 0 && sessions[currentSessionIndex]) {
        const hasScrollbar = chatArea.scrollHeight > chatArea.clientHeight;
        const currentSession = sessions[currentSessionIndex];
  
        // Check if the current session does not have a scrollbar and unseen message count is greater than 0
        if (!hasScrollbar && unseenMessageCounts[currentSession._id] > 0) {
          // Reset unseen message count for the current session
          setUnseenMessageCounts(prevCounts => ({
            ...prevCounts,
            [currentSession._id]: 0
          }));
  
          // Emit the socket event with sessionId and userId to reset count in backend
          socket.emit('reset-unseen-count', {
            sessionId: currentSession._id, 
            userId: userData.id // Use userData.id only if userData is not null
          });
  
          console.log(`No scrollbar present in session ${currentSessionIndex}. Unseen count reset.`);
        }
      }
    };
  
    checkScrollbarAndResetUnseenCount();
  
  }, [sessions, currentSessionIndex, unseenMessageCounts, userData, setUnseenMessageCounts]);
  
  

  return (
    <div className="App">

      <HistoryPane
        ref={historyPaneRef}
        sessions={sessions}
        onNewSession={handleNewSession}
        onSelectSession={handleSessionSelectAndUpdate}
        onDeleteSession={handleDeleteSession}
        userName={userData?.name}
        userImage={userData?.image}
        isPaneOpen={isPaneOpen}
        togglePane={togglePane}
        isAdmin={isAdmin}
        unseenMessageCounts={unseenMessageCounts}
        userId={userData?.id}
        resetUnseenCount={resetUnseenCount}
      />
      <Header 
        isPaneOpen={isPaneOpen} 
        onNewSession={handleNewSession} 
        togglePane={togglePane}
        isAdmin={isAdmin} // Pass isAdmin to the Header component
      />
      <div className="chat-area" ref={chatAreaRef}>
        
        {sessions[currentSessionIndex] && sessions[currentSessionIndex].messages.length === 0 && (
          <div className="chat-heading">
            How can I help you today?
          </div>
        )}
        {sessions[currentSessionIndex]?.messages.map((msg, index) => {
          const showRoleLabel = index === 0 || sessions[currentSessionIndex].messages[index - 1].role !== msg.role;
          const messageKey = msg._id ? msg._id.$oid : `temp-${index}`;
          return (
            <AnswerDisplay
              key={messageKey}
              role={msg.role}
              content={msg.content}
              userImage={userData?.image}
              onMoreDetailsClick={handleMoreDetailsRequest}
              attachments={msg.attachments}
              showRoleLabel={showRoleLabel}
              timestamp={msg.timestamp}
            />
          );
        })}
      </div>
      <InputBox onSubmit={handleQuerySubmit} isLoading={isLoading} />
    </div>
  );
}

export default Chat;