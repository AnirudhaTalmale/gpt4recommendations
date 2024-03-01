import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import InputBox from './InputBox';
import SampleQueries from './SampleQueries';
import AnswerDisplay from './AnswerDisplay';
import HistoryPane from './HistoryPane';
import Lightbox from './Lightbox';
import LightboxForImage from './LightboxForImage';
import LightboxForBookPreview from './LightboxForBookPreview';
import '../App.css';
import socket from './socket';
import Header from './Header';

function Chat() {

  const [sessions, setSessions] = useState([]);
  const [isPaneOpen, setIsPaneOpen] = useState(window.innerWidth >= 760 ? true : false);
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const savedSessionId = localStorage.getItem('currentSessionId');
  
    // Check if savedSessionId is the string "null" and log if it is
    if (savedSessionId === "null") {
      console.log("Converting 'null' string to null");
      return null;
    }
  
    // Return the savedSessionId if it's not null, otherwise return null
    return savedSessionId !== null ? savedSessionId : null;
  });
  
  
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const historyPaneRef = useRef(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [lastUserMessage, setLastUserMessage] = useState(null);
  const [isMoreDetailsState, setIsMoreDetailsState] = useState(false);
  const [isKeyInsightsState, setIsKeyInsightsState] = useState(false);
  const [isAnecdotesState, setIsAnecdotesState] = useState(false);
  const [bookTitleState, setBookTitleState] = useState(null);
  const [authorState, setAuthorState] = useState(null);
  const [moreBooks, setMoreBooks] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const lightboxContentRef = useRef(null);
  const [lightboxContent, setLightboxContent] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAtBottomLightbox, setIsAtBottomLightbox] = useState(false);
  const [isBookPreviewLightboxOpen, setIsBookPreviewLightboxOpen] = useState(false);
  const [bookIdForPreview, setBookIdForPreview] = useState('');
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
  const bookPreviewRef = useRef(null);

  useEffect(() => {
    if (!window.google || !window.google.books) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/books/jsapi.js';
      script.onload = () => {
        window.google.books.load();
        setIsViewerLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setIsViewerLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isBookPreviewLightboxOpen && bookIdForPreview) {
      loadGoogleBooksViewer(bookIdForPreview);
    }
  }, [isBookPreviewLightboxOpen, bookIdForPreview]);

  const loadGoogleBooksViewer = (bookId) => {
    if (window.google && window.google.books && bookPreviewRef.current) {
      var viewer = new window.google.books.DefaultViewer(bookPreviewRef.current);
      viewer.load(`ISBN:${bookId}`, function() {
        console.error("Google Books could not load the book.");
      });
    }
  };

  const handlePreviewClick = async (isbn) => {
    if (isViewerLoaded) {
      if (isbn) {
        setBookIdForPreview(isbn);
        setIsBookPreviewLightboxOpen(true); // Directly open the lightbox here
      } else {
        console.log("ISBN not available for the book");
      }
    }
  };

  const isUserAtBottomLightbox = useCallback(() => {
    if (!lightboxContentRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = lightboxContentRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
    return isAtBottom;
  }, []);
  
  const scrollToBottomLightbox = () => {
    if (lightboxContentRef.current) {
      lightboxContentRef.current.scrollTop = lightboxContentRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isAtBottomLightbox) {
      scrollToBottomLightbox();
    }
  }, [lightboxContent, isAtBottomLightbox]);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtBottomLightbox(isUserAtBottomLightbox());
    };
  
    const lightboxContentElement = lightboxContentRef.current;
  
    if (isLightboxOpen && lightboxContentElement) {
      lightboxContentElement.addEventListener('scroll', handleScroll);
  
      return () => {
        lightboxContentElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isLightboxOpen, isUserAtBottomLightbox]);

  const currentSessionIdRef = useRef(currentSessionId);

  // Update the ref whenever currentSessionId changes
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  const [initialQuery, setInitialQuery] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const bookTitle = queryParams.get('bookTitle');
    const author = queryParams.get('author');

    if (bookTitle) {
      let query = `Explain the book - ${bookTitle}`;
      if (author) {
        query += ` by ${author}`;
      }
      setInitialQuery(query);
    }
  }, []);

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
    if (isInitialLoad || currentSessionId !== null) {
      scrollToBottom();
    }
  }, [currentSessionId, isInitialLoad]);
  
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
    // Find the current session by ID
    const currentSession = sessions.find(session => session._id === currentSessionId);

    // Extract the messages of the current session
    const currentMessages = currentSession?.messages;
    
    // Ensure there are messages before accessing the last message
    if (currentMessages && currentMessages.length > 0) {
      const lastMessage = currentMessages[currentMessages.length - 1];
    
      if (shouldAutoScroll && lastMessage && lastMessage.contentType === 'streamed') {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    }
  }, [currentSessionId, shouldAutoScroll, sessions]);

  
  useEffect(() => {
    // Check if currentSessionId is not null and not the string "null" before saving to localStorage
    if (currentSessionId !== null && currentSessionId !== "null") {
      localStorage.setItem('currentSessionId', currentSessionId);
    } else {
      // If currentSessionId is null, remove the item from localStorage
      localStorage.removeItem('currentSessionId');
    }
  
    // Set selectedSessionId based on the validity of currentSessionId
    setSelectedSessionId(currentSessionId && currentSessionId !== "null" ? currentSessionId : null);
  }, [currentSessionId]);
  
  useEffect(() => {
    const savedSessionId = localStorage.getItem('currentSessionId');
    // Check if savedSessionId is neither null nor the string "null"
    if (savedSessionId && savedSessionId !== "null") {
      setCurrentSessionId(savedSessionId);
    } else if (sessions.length > 0) {
      // If there is no valid saved session ID, load the latest session's ID
      setCurrentSessionId(sessions[sessions.length - 1]._id);
    } else {
      // If there are no sessions, set to null
      setCurrentSessionId(null);
    }
  }, [sessions]);  
  
  const handleSavedQueryParams = useCallback(() => {
    const savedQueryParams = localStorage.getItem('queryParams');
    if (savedQueryParams) {
      const queryParams = new URLSearchParams(savedQueryParams);
      const bookTitle = queryParams.get('bookTitle');
      const author = queryParams.get('author');
  
      if (bookTitle) {
        let query = `Explain the book - ${bookTitle}`;
        if (author) {
          query += ` by ${author}`;
        }
        setInitialQuery(query); 
      }
      // After handling, remove them from local storage
      localStorage.removeItem('queryParams');
    }
  }, []); // Add dependencies here if any
  

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
  
  
  const updateSessionMessages = useCallback((messageContent, contentType = 'simple', isUserMessage = true, moreBooks = false) => {
    setSessions(prevSessions => {
      // Find the current session by its ID
      const currentSessionId = currentSessionIdRef.current;
      const updatedSessions = [...prevSessions];
      const currentSessionIndex = updatedSessions.findIndex(session => session._id === currentSessionId);
      if (currentSessionIndex === -1) {
        return updatedSessions; // If session not found, return the sessions as is
      }

      const currentSession = { ...updatedSessions[currentSessionIndex] };
      
      // Handle the case for streamed content for the assistant's messages
      if (contentType === 'streamed' && !isUserMessage) {
        let updatedMessages = [...currentSession.messages];
        const lastMessageIndex = updatedMessages.length - 1;
  
        if (moreBooks || (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].role === 'assistant')) {
          updatedMessages[lastMessageIndex] = {
            ...updatedMessages[lastMessageIndex],
            content: updatedMessages[lastMessageIndex].content + messageContent,
          };
        } else {
          updatedMessages.push({ role: 'assistant', contentType, content: messageContent });
        }
  
        currentSession.messages = updatedMessages;
      } else {
        const newMessage = {
          role: isUserMessage ? 'user' : 'assistant',
          contentType,
          content: messageContent,
        };
        currentSession.messages = [...currentSession.messages, newMessage];
      }
      
      updatedSessions[currentSessionIndex] = currentSession;

      if (isUserMessage) {
        setLastUserMessage({ content: messageContent, sessionId: currentSession._id });
      }

      return updatedSessions;
    });
  }, []);


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
      // Get the current session's ID
      const currentSessionId = currentSessionIdRef.current;

      if (currentSessionId === sessionId) {
        setIsStreaming(false);
      }
    };
  
    socket.on('streamEnd', handleStreamEnd);
  
    return () => {
      // Cleanup: remove the listener when the component unmounts
      socket.off('streamEnd', handleStreamEnd);
    };
  }, [currentSessionIdRef]); // Update dependencies


  useEffect(() => {
    let streamTimeout;
  
    const handleStreamChunk = ({ content, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, moreBooks }) => {
      // Get the current session's ID
      const currentSessionId = currentSessionIdRef.current;

      if (currentSessionId === sessionId) {
        if (isMoreDetails || isKeyInsights || isAnecdotes) {
          setLightboxContent(prevContent => prevContent + content);
          setIsStreaming(true);
          setIsLightboxOpen(true);
        } else {
          updateSessionMessages(content, 'streamed', false, moreBooks);
          setIsStreaming(true);
        }
    
        clearTimeout(streamTimeout);
        streamTimeout = setTimeout(() => {
          handleStopStreaming();
        }, 7000); // 7 seconds
      }
    };
  
    socket.on('chunk', handleStreamChunk);
  
    return () => {
      socket.off('chunk', handleStreamChunk);
      clearTimeout(streamTimeout); 
    };
  }, [updateSessionMessages, handleStopStreaming, currentSessionIdRef]); // Updated dependencies

  
  useEffect(() => {

    const handleMessageLimitReached = ({ content, sessionId }) => {
      // Get the current session's ID
      const currentSessionId = currentSessionIdRef.current;

      if (currentSessionId === sessionId) {
        updateSessionMessages(content, 'streamed', false, null); 
      }
    };

    socket.on('messageLimitReached', handleMessageLimitReached);

    return () => {
      socket.off('messageLimitReached', handleMessageLimitReached);
    };
  }, [updateSessionMessages, currentSessionIdRef]); 
  
  useEffect(() => {
    // Find the current session by its ID
    const currentSessionId = currentSessionIdRef.current;
    const currentSession = sessions.find(session => session._id === currentSessionId);

    if (lastUserMessage && currentSession?._id === lastUserMessage.sessionId) {
      const isFirstQuery = currentSession?.messages?.length === 1;

      socket.emit('query', {
        sessionId: lastUserMessage.sessionId,
        message: {
          role: 'user',
          content: lastUserMessage.content,
          isFirstQuery
        },
        isMoreDetails: isMoreDetailsState,
        isKeyInsights: isKeyInsightsState,
        isAnecdotes: isAnecdotesState,
        bookTitle: bookTitleState,
        author: authorState,
        moreBooks: moreBooks,
        isEdit: isEdit
      });

      // Reset lastUserMessage to avoid duplicate emissions
      setLastUserMessage(null);
    }
  }, [lastUserMessage, sessions, isMoreDetailsState, isKeyInsightsState, isAnecdotesState, bookTitleState, authorState, moreBooks, isEdit]);
  
  const handleQuerySubmit = async (query, isMoreDetails = false, bookTitle = null, author = null, moreBooks = false, isKeyInsights = false, isAnecdotes = false, isEdit = false) => {
    setIsLoading(true);
  
    // Get the current session's ID
    const currentSessionId = currentSessionIdRef.current;
    let currentSession = sessions.find(session => session._id === currentSessionId);

    // If there's no current session ID, create a new session
    if (!currentSessionId) {
      currentSession = await handleNewSession();
    }
    
    const isFirstQuery = currentSession?.messages?.length === 0;
    if (!isMoreDetails && query.startsWith("Explain the book - ")) {
      const queryWithoutPrefix = query.slice("Explain the book - ".length);
      const parts = queryWithoutPrefix.split(" by ");

      if (parts.length > 0) {
        bookTitle = parts[0].trim();
        author = parts.length > 1 ? parts[1].trim() : null;
      }
    }

    setIsMoreDetailsState(isMoreDetails);
    setIsKeyInsightsState(isKeyInsights);
    setIsAnecdotesState(isAnecdotes);
    setBookTitleState(bookTitle);
    setAuthorState(author);
    setMoreBooks(moreBooks);
    setIsEdit(isEdit);

    if (!isMoreDetails && !moreBooks && !isKeyInsights && !isAnecdotes && !isEdit) {
      updateSessionMessages(query, 'simple', true);
    }
    else {
      socket.emit('query', {
        sessionId: currentSessionId, // Use the current session ID
        message: {
          role: 'user',
          content: query,
          isFirstQuery
        },
        isMoreDetails,
        isKeyInsights,
        isAnecdotes,
        bookTitle,
        author,
        moreBooks,
        isEdit
      });
    }
  };

  const isSessionEmpty = (session) => {
    return session.messages.length === 0;
  };

  const handleNewSession = useCallback(async () => {
    
    // Check if the last session is empty and return its ID if so
    if (sessions.length > 0 && isSessionEmpty(sessions[sessions.length - 1])) {
      const lastSessionId = sessions[sessions.length - 1]._id;
      setCurrentSessionId(lastSessionId);
      currentSessionIdRef.current = lastSessionId;
      return sessions[sessions.length - 1]; // Return the last session if it's empty
    } else {
      try {
        if (!userData) {
          return;
        } 
        const res = await axios.post('http://localhost:3000/api/session', { userId: userData.id });
        const newSession = res.data;
        setSessions(prevSessions => [...prevSessions, newSession]);
        setCurrentSessionId(newSession._id);
        currentSessionIdRef.current = newSession._id;
        setSelectedSessionId(newSession._id);
        return newSession; // Return the new session data
      } catch (error) {
        console.error('Error creating new session:', error);
      }
    }
  }, [userData, sessions]);

  useEffect(() => {
    const handleNewMessageSaved = (data) => {
      const { sessionId, savedMessage } = data;
  
      if (sessionId === currentSessionIdRef.current) {
        setSessions((prevSessions) => {
          return prevSessions.map((session) => {
            if (session._id === sessionId) {
              // Replace the last message (which was added without an ID) with the savedMessage
              return {
                ...session,
                messages: [...session.messages.slice(0, -1), savedMessage],
              };
            }
            return session;
          });
        });
      }
    };
  
    socket.on('messageSaved', handleNewMessageSaved);
  
    return () => {
      socket.off('messageSaved', handleNewMessageSaved);
    };
  }, [currentSessionIdRef]);

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
        if (!authResponse.data.onboardingComplete) {
          window.location.href = 'http://localhost:3001/onboarding';
          return; 
        }
  
        // If onboarding is complete, proceed to fetch user info
        const userInfoResponse = await axios.get('http://localhost:3000/api/user-info', { withCredentials: true });
  
        if (userInfoResponse.status === 200 && userInfoResponse.data.isAuthenticated) {
          const currentUserData = userInfoResponse.data.user;
          setUserData(currentUserData);

          loadSessions(currentUserData);
          handleSavedQueryParams();
        }
      } else {
        localStorage.setItem('queryParams', window.location.search);
        window.location.href = 'http://localhost:3001/auth/login';
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      localStorage.setItem('queryParams', window.location.search);
      window.location.href = 'http://localhost:3001/auth/login';
    }
  }, [loadSessions, setUserData, handleSavedQueryParams]);
  
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleDeleteSession = async (sessionId) => {
    try {
      await axios.delete(`http://localhost:3000/api/session/${sessionId}`);
      setSessions(prevSessions => prevSessions.filter(session => session._id !== sessionId));
  
      // Update the current session ID after deletion
      setCurrentSessionId(prevCurrentSessionId => {
        if (prevCurrentSessionId === sessionId) {
          // If the deleted session was the current one, switch to another session (e.g., the last one) or set to null if no sessions are left
          const newSessionId = sessions.length > 1 ? sessions[sessions.length - 1]._id : null;
          currentSessionIdRef.current = newSessionId; // Also update the ref synchronously
          return newSessionId;
        }
        return prevCurrentSessionId; // Keep the current session ID unchanged if the deleted session was not the current one
      });
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };
  
  
  const setCurrentSessionIdWithStreamCheck = newSessionId => {
    if (currentSessionId !== newSessionId && isStreaming) {
      handleStopStreaming(); // Stop streaming if it's active and session changes
    }
    setCurrentSessionId(newSessionId);
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

  const fetchAnecdotes = async (bookTitle, author) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/anecdotes`, {
        params: { bookTitle, author }
      });
      return response; 
    } catch (error) {
      throw error; 
    }
  };  
  

  const handleAnecdotesRequest = async (bookTitle, author) => {
    try {
      const response = await fetchAnecdotes(bookTitle, author);

      if (!response || !response.data || !response.data.anecdotes) {
        const userQuery = `${bookTitle}`;
        console.log("userQuery is:", userQuery);
        handleQuerySubmit(userQuery, false, bookTitle, author, false, false, true);
      } else {
        const anecdotes = response.data.anecdotes;
        setLightboxContent(''); // Reset the content
        setLightboxContent(anecdotes);
        setIsLightboxOpen(true);
      }
    } catch (error) {
      const userQuery = `${bookTitle}`;
      handleQuerySubmit(userQuery, false, bookTitle, author, false, false, true);
    }
  };

  const fetchKeyInsights = async (bookTitle, author) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/key-insights`, {
        params: { bookTitle, author }
      });
      return response; 
    } catch (error) {
      throw error;
    }
  };  
  

  const handleKeyInsightsRequest = async (bookTitle, author) => {
    try {
      const response = await fetchKeyInsights(bookTitle, author);

      if (!response || !response.data || !response.data.keyInsights) {
        const userQuery = `${bookTitle}`;
        handleQuerySubmit(userQuery, false, bookTitle, author, false, true);
      } else {
        const keyInsights = response.data.keyInsights;
        setLightboxContent(''); // Reset the content
        setLightboxContent(keyInsights);
        setIsLightboxOpen(true);
      }
    } catch (error) {
      const userQuery = `${bookTitle}`;
      handleQuerySubmit(userQuery, false, bookTitle, author, false, true);
    }
  };

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
        const userQuery = `Explain the book - ${bookTitle} by ${author} - `;
        handleQuerySubmit(userQuery, true, bookTitle, author);
      } else {
        const detailedDescription = response.data.detailedDescription;
        setLightboxContent(''); // Reset the content
        setLightboxContent(detailedDescription);
        setIsLightboxOpen(true);
      }
    } catch (error) {
      const userQuery = `Explain the book - ${bookTitle} by ${author} - `;
      handleQuerySubmit(userQuery, true, bookTitle, author);
    }
  };

  const [showContinueButton, setShowContinueButton] = useState(false);

  function extractTags(content) {
    // Initialize the array to store extracted book titles and authors
    const bookDetails = [];
  
    // Regex to match each book section in the content
    const bookInfoMatches = content.match(/<div class="book-info">[\s\S]*?<\/div>(?=<div)/g) || [];
    bookInfoMatches.forEach((bookInfo, index) => {
      // Extract the book title
      const titleMatch = bookInfo.match(/<h3 class="book-title">(.*?)<\/h3>/);
      const title = titleMatch ? titleMatch[1].trim() : '';
  
      // Extract the book author
      const authorMatch = bookInfo.match(/<span class="book-author">(.*?)<\/span>/);
      const author = authorMatch ? authorMatch[1].trim() : '';
  
      // Combine title and author with numbering
      if (title && author) {
        bookDetails.push(`${index + 1}. ${title} ${author}`);
      }
    });
  
    // Return the extracted book titles and authors
    return bookDetails.join('\n'); // Joining with newline character
  }

  const onContinueGenerating = () => {
    // Find the current session by its ID
    const currentSessionId = currentSessionIdRef.current;
    const currentSession = sessions.find(session => session._id === currentSessionId);

    if (currentSession && currentSession.messages.length >= 2) {
        const lastTwoMessages = currentSession.messages.slice(-2); // Get the last two messages

        // Apply extractTags to the content of the last message and prepend with the required text
        const processedLastMessageContent = "Previously recommended books are as follows: \n" + extractTags(lastTwoMessages[1].content);

        // Prepend the required text to the content of the second to last message and enclose the content in quotes
        const userQueryContent = `User query - "${lastTwoMessages[0].content}"`;

        // Concatenate the modified contents
        const concatenatedContent = `${userQueryContent}\n${processedLastMessageContent}\n`;

        handleQuerySubmit(concatenatedContent, false, null, null, true);
    }
  };

  useEffect(() => {
    // Find the current session by its ID
    const currentSessionId = currentSessionIdRef.current;
    const currentSession = sessions.find(session => session._id === currentSessionId);

    if (currentSession && currentSession.messages.length > 0) {
        const lastMessage = currentSession.messages[currentSession.messages.length - 1];
        if (lastMessage.role === 'assistant') {
            const bookCount = extractTags(lastMessage.content).split('\n').length;
            setShowContinueButton(bookCount >= 5 && bookCount <= 20);
        } else {
            setShowContinueButton(false);
        }
    } else {
        setShowContinueButton(false);
    }
}, [sessions, currentSessionIdRef]); // Updated dependencies

  
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);
  const [isLightboxForImageOpen, setIsLightboxForImageOpen] = useState(false);

  const handleImageClick = (imageUrl) => {
    setLightboxImageUrl(imageUrl);
    setIsLightboxForImageOpen(true);
  };

  const [inputBoxHeight, setInputBoxHeight] = useState(0);

  // Message-question edit functionality

  const handleEditMessage = async (sessionId, messageId, newContent) => {
    try {
      const response = await axios.post(`http://localhost:3000/api/session/${sessionId}/edit-message/${messageId}`, { newContent });
      if (response.status === 200) {
        // Update the local state to reflect the changes
        setSessions(prevSessions => prevSessions.map(session => {
          if (session._id === sessionId) {
            // Keep messages up to the edited one
            const updatedMessages = session.messages.filter((msg, index) => {
              return index <= session.messages.findIndex(m => m._id === messageId);
            });
            // Update the content of the edited message
            updatedMessages[updatedMessages.length - 1].content = newContent;
            return { ...session, messages: updatedMessages };
          }
          return session;
        }));
        handleQuerySubmit(newContent, false, null, null, false, false, false, true);
      }
    } catch (error) {
      console.error('Error editing message:', error);
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
        contentRef={lightboxContentRef}
      />
      <LightboxForImage
        isOpen={isLightboxForImageOpen}
        onClose={() => {
          setIsLightboxForImageOpen(false);
          if (isStreaming) {
            handleStopStreaming(); // Stop streaming if it's active
          }
        }}
        imageUrl={lightboxImageUrl}
      />
      <LightboxForBookPreview
        isOpen={isBookPreviewLightboxOpen}
        onClose={() => {
          setIsBookPreviewLightboxOpen(false);
          setBookIdForPreview(''); // Reset book ID when closing lightbox
        }}
        contentRef={bookPreviewRef}
      />
      <HistoryPane
        ref={historyPaneRef}
        sessions={sessions}
        onNewSession={handleNewSession}
        onSelectSession={setCurrentSessionIdWithStreamCheck}
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
        
        {sessions.find(session => session._id === selectedSessionId) && sessions.find(session => session._id === selectedSessionId).messages.length === 0 && (
          <div className="chat-heading">
            Discover Your Next Great Read!
          </div>
        )}
        {sessions.find(session => session._id === selectedSessionId)?.messages.map((msg, index, messageArray) => {
        const isLastMessage = index === messageArray.length - 1;
        const isLastMessageFromAssistant = isLastMessage && msg.role === 'assistant';
        return (
          <AnswerDisplay
            onPreviewClick={handlePreviewClick}
            key={msg._id} // Assuming msg._id is a unique identifier
            role={msg.role}
            content={msg.content}
            userImage={userData?.image}
            isStreaming={isStreaming}
            onMoreDetailsClick={handleMoreDetailsRequest}
            onKeyInsightsClick={handleKeyInsightsRequest}
            onAnecdotesClick={handleAnecdotesRequest}
            showContinueButton={showContinueButton && isLastMessageFromAssistant}
            onContinueGenerating={onContinueGenerating}
            onImageClick={handleImageClick}
            sessionId={currentSessionId} // You need to pass the current session ID
            messageId={msg._id} // Assuming each message has a unique ID
            onEditMessage={handleEditMessage}
          />
          );
        })}
      </div>
      { (sessions.length === 0 || (sessions.find(session => session._id === selectedSessionId) && sessions.find(session => session._id === selectedSessionId).messages.length === 0)) && (
          <SampleQueries
            onSubmit={handleQuerySubmit}
            inputBoxHeight={inputBoxHeight} // And here you pass the inputBoxHeight state down to SampleQueries
          />
      )}
      <InputBox
        onSubmit={handleQuerySubmit}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onStopStreaming={handleStopStreaming}
        initialQuery={initialQuery}
        onHeightChange={setInputBoxHeight} // Here you pass the setInputBoxHeight function to the InputBox
      />
      
    </div>
  );
}

export default Chat;