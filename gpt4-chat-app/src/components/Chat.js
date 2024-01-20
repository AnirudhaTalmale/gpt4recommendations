import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import InputBox from './InputBox';
import AnswerDisplay from './AnswerDisplay';
import HistoryPane from './HistoryPane';
import Lightbox from './Lightbox';
import '../App.css';
import socket from './socket';
import Header from './Header';

function Chat() {
  const [sessions, setSessions] = useState([]);
  const [isPaneOpen, setIsPaneOpen] = useState(window.innerWidth >= 760 ? true : false);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(() => {
    const savedSessionIndex = localStorage.getItem('currentSessionIndex');
    if (savedSessionIndex !== null) {
      const parsedIndex = parseInt(savedSessionIndex, 10);
      // Ensure the index is not less than -1
      return parsedIndex >= -1 ? parsedIndex : -1;
    }
    return -1; // Default value if nothing is in localStorage
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const historyPaneRef = useRef(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [lastUserMessage, setLastUserMessage] = useState(null);
  const [isMoreDetailsState, setIsMoreDetailsState] = useState(false);
  const [bookTitleState, setBookTitleState] = useState(null);
  const [authorState, setAuthorState] = useState(null);

  const currentSessionIndexRef = useRef(currentSessionIndex);

  // Update the ref whenever currentSessionIndex changes
  useEffect(() => {
    currentSessionIndexRef.current = currentSessionIndex;
  }, [currentSessionIndex]);

  const [initialQuery, setInitialQuery] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const bookTitle = queryParams.get('bookTitle');
    const author = queryParams.get('author');

    if (bookTitle) {
      let query = `Explain this book - ${bookTitle}`;
      if (author) {
        query += ` by ${author}`;
      }
      setInitialQuery(query);
    }
  }, []);

  const [lightboxContent, setLightboxContent] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const chatAreaRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const togglePane = useCallback(() => {
    setIsPaneOpen(!isPaneOpen);
  }, [isPaneOpen]); 

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
    // Extract the complex expression to a variable
    const currentMessages = sessions[currentSessionIndex]?.messages;
    
    // Ensure there are messages before accessing the last message
    if (currentMessages && currentMessages.length > 0) {
      const lastMessage = currentMessages[currentMessages.length - 1];
    
      if (shouldAutoScroll && lastMessage && lastMessage.contentType === 'streamed') {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    }
  }, [currentSessionIndex, shouldAutoScroll, sessions]); 
  
  useEffect(() => {
    // Save currentSessionIndex to localStorage
    console.log("setting currentSessionIndex as: ", currentSessionIndex);
    localStorage.setItem('currentSessionIndex', currentSessionIndex);
    
    if (currentSessionIndex >= 0 && currentSessionIndex < sessions.length) {
      setSelectedSessionId(sessions[currentSessionIndex]._id);
  } 
  }, [currentSessionIndex, sessions]);
  
  
  
  useEffect(() => {
    const savedSessionIndex = localStorage.getItem('currentSessionIndex');
    if (savedSessionIndex) {
      setCurrentSessionIndex(parseInt(savedSessionIndex, 10));
    } else {
      // If there is no saved index, load the latest session
      setCurrentSessionIndex(sessions.length - 1);
    }
  }, [sessions.length, currentSessionIndex]);
  
  const handleSavedQueryParams = () => {
    const savedQueryParams = localStorage.getItem('queryParams');
    if (savedQueryParams) {
      const queryParams = new URLSearchParams(savedQueryParams);
      const bookTitle = queryParams.get('bookTitle');
      const author = queryParams.get('author');
  
      if (bookTitle) {
        let query = `Explain this book - ${bookTitle}`;
        if (author) {
          query += ` by ${author}`;
        }
        setInitialQuery(query); 
      }
      // After handling, remove them from local storage
      localStorage.removeItem('queryParams');
    }
  };

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

      console.log("updateSessionMessages has currentSessionIndex as: ", currentSessionIndexRef.current);

      const currentIdx = currentSessionIndexRef.current; // Use ref to get the current index
      const updatedSessions = [...prevSessions];
      const currentSession = { ...updatedSessions[currentIdx] };
      
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
        console.log("currentSession before update is: ", JSON.parse(JSON.stringify(currentSession)));
        const newMessage = {
          role: isUserMessage ? 'user' : 'assistant',
          contentType,
          content: messageContent,
        };
        // Append the new message to the cloned messages array
        currentSession.messages = [...currentSession.messages, newMessage];
        console.log("currentSession after update is: ", JSON.parse(JSON.stringify(currentSession)));
      }
      
      // Update the current session in the sessions array
      updatedSessions[currentIdx] = currentSession;

      if (isUserMessage) {
        setLastUserMessage({ content: messageContent, sessionId: currentSession._id });
      }

      console.log("updatedSessions is: ", updatedSessions);
      console.log("updatedSessions length is: ", updatedSessions.length);
      return updatedSessions;
    });
  }, []);

  useEffect(() => {
    if (lastUserMessage && sessions[currentSessionIndexRef.current]?._id === lastUserMessage.sessionId) {
      const isFirstQuery = sessions[currentSessionIndexRef.current]?.messages?.length === 1;
  
      socket.emit('query', {
        sessionId: lastUserMessage.sessionId,
        message: {
          role: 'user',
          content: lastUserMessage.content,
          isFirstQuery
        },
        isMoreDetails: isMoreDetailsState,
        bookTitle: bookTitleState,
        author: authorState
      });
  
      // Reset lastUserMessage to avoid duplicate emissions
      setLastUserMessage(null);
    }
  }, [lastUserMessage, sessions, isMoreDetailsState, bookTitleState, authorState]);

  const handleStopStreaming = useCallback(async () => {
    try {
      await axios.post('http://localhost:3000/api/stop-stream');
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
  
    const handleStreamChunk = ({ content, sessionId, isMoreDetails }) => {
      if (sessions[currentSessionIndex]._id === sessionId) {
        if (isMoreDetails) {
          // If it's a more details response, display in Lightbox
          setLightboxContent(prevContent => prevContent + content);
          setIsStreaming(true);
          setIsLightboxOpen(true);
        } else {
          // Regular message handling
          updateSessionMessages(content, 'streamed', false);
          setIsStreaming(true);
        }
    
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
  

  const handleQuerySubmit = async (query, isMoreDetails = false, bookTitle = null, author = null) => {
    setIsLoading(true);
  
    console.log("current session index is: ", currentSessionIndexRef.current);
  
    if (currentSessionIndexRef.current === -1) {
      console.log("new query submitted when current session index is ", currentSessionIndexRef.current);
      await handleNewSession();
    }
  
    const isFirstQuery = sessions[currentSessionIndexRef.current]?.messages?.length === 0;
    if (!isMoreDetails && query.startsWith("Explain this book - ")) {
      const queryWithoutPrefix = query.slice("Explain this book - ".length);
      const parts = queryWithoutPrefix.split(" by ");

      if (parts.length > 0) {
        bookTitle = parts[0].trim();
        author = parts.length > 1 ? parts[1].trim() : null;
      }
    }

    setIsMoreDetailsState(isMoreDetails);
    setBookTitleState(bookTitle);
    setAuthorState(author);

    if (!isMoreDetails) {
      console.log("sending to updateSessionMessages, the currentSessionIndex as: ", currentSessionIndexRef.current);
      updateSessionMessages(query, 'simple', true); // Removed the currentSessionIndex parameter, as it's now accessed within updateSessionMessages
    }
    else {
      socket.emit('query', {
        sessionId: sessions[currentSessionIndexRef.current]._id,
        message: {
          role: 'user',
          content: query,
          isFirstQuery
        },
        isMoreDetails,
        bookTitle,
        author
      });
    }
  };  

  const isSessionEmpty = (session) => {
    return session.messages.length === 0;
  };

  const handleNewSession = useCallback(async () => {
    
    if (sessions.length > 0 && isSessionEmpty(sessions[sessions.length - 1])) {
      console.log("last session is empty");
      setCurrentSessionIndex(sessions.length - 1);
      return sessions[sessions.length - 1]; // Return the last session if it's empty
    } else {
      try {
        console.log("initiating new session creation");
        if (!userData) return;
        const res = await axios.post('http://localhost:3000/api/session', { userId: userData.id });
        const newSession = res.data;
        setSessions(prevSessions => {
          const updatedSessions = [...prevSessions, newSession];
          const newIdx = updatedSessions.length - 1;
          setCurrentSessionIndex(newIdx);
          currentSessionIndexRef.current = newIdx;
          console.log("new session created with currentSessionIndex as: ", currentSessionIndexRef.current);
          return updatedSessions;
        });
        setSelectedSessionId(newSession._id);
        return newSession; // Return the new session data
      } catch (error) {
        console.error('Error creating new session:', error);
      }
    }
  }, [userData, sessions]); // Add dependencies here
  

  const loadSessions = useCallback(async (currentUserData) => {
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

  const checkAuthStatus = useCallback(async () => {
    try {
      const authResponse = await axios.get('http://localhost:3000/api/check-auth', { withCredentials: true });
  
      if (authResponse.status === 200 && authResponse.data.isAuthenticated) {
        const userInfoResponse = await axios.get('http://localhost:3000/api/user-info', { withCredentials: true });
  
        if (userInfoResponse.status === 200 && userInfoResponse.data.isAuthenticated) {
          const currentUserData = userInfoResponse.data.user;
          setUserData(currentUserData);
          loadSessions(currentUserData);
          // Check if there are saved query params in local storage and handle them
          handleSavedQueryParams();
        }
      } else {
        // Save the current query params to local storage before redirecting
        localStorage.setItem('queryParams', window.location.search);
        window.location.href = 'http://localhost:3001/auth/login';
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      localStorage.setItem('queryParams', window.location.search);
      window.location.href = 'http://localhost:3001/auth/login';
    }
  }, [loadSessions]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

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

  const fetchMoreDetails = async (bookTitle, author) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/more-details`, {
        params: { bookTitle, author }
      });
      return response; // Return the response for further handling
    } catch (error) {
      throw error; // Throw the error to be caught in the calling function
    }
  };  

  const handleMoreDetailsRequest = async (bookTitle, author) => {
    try {
      const response = await fetchMoreDetails(bookTitle, author);

      if (!response || !response.data || !response.data.detailedDescription) {
        const userQuery = `Explain this book - ${bookTitle} by ${author} - `;
        handleQuerySubmit(userQuery, true, bookTitle, author);
        console.log("i am in if block");
      } else {
        const detailedDescription = response.data.detailedDescription;
        setLightboxContent(''); // Reset the content
        setLightboxContent(detailedDescription);
        setIsLightboxOpen(true);
      }
    } catch (error) {
      const userQuery = `Explain this book - ${bookTitle} by ${author} - `;
      handleQuerySubmit(userQuery, true, bookTitle, author);
      console.log("i am in catch block");
    }
  };

  return (
    <div className="App">
      <Lightbox
        isOpen={isLightboxOpen}
        content={lightboxContent}
        onClose={() => {
          setIsLightboxOpen(false);
          setLightboxContent(''); // Clear the content when Lightbox is closed
          if (isStreaming) {
            handleStopStreaming(); // Stop streaming if it's active
          }
        }}
      />
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
        selectedSessionId={selectedSessionId}
        setSelectedSessionId={setSelectedSessionId}
      />
      <Header isPaneOpen={isPaneOpen} onNewSession={handleNewSession} togglePane={togglePane} />
      <div className="chat-area" ref={chatAreaRef}>
        
        {sessions[currentSessionIndex] && sessions[currentSessionIndex].messages.length === 0 && (
          <div className="chat-heading">
            Discover Your Next Great Read!
          </div>
        )}
        {sessions[currentSessionIndex]?.messages.map((msg) => (
          <AnswerDisplay
            key={msg._id} // Assuming msg._id is a unique identifier
            role={msg.role}
            content={msg.content}
            userImage={userData?.image}
            isStreaming={isStreaming}
            onMoreDetailsClick={handleMoreDetailsRequest}
          />
        ))}
      </div>
      
      <InputBox onSubmit={handleQuerySubmit} isLoading={isLoading} isStreaming={isStreaming} onStopStreaming={handleStopStreaming} initialQuery={initialQuery} />
      
    </div>
  );
}

export default Chat;