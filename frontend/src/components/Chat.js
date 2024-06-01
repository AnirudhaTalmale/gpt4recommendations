import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { handleAnecdotesRequest, handleKeyInsightsRequest, handleMoreDetailsRequest, handleQuotesRequest, checkAuthStatus } from './CommonFunctions';
import InputBox from './InputBox';
import AnswerDisplay from './AnswerDisplay';
import HistoryPane from './HistoryPane';
import Home from './Home';
import Lightbox from './Lightbox';
import LightboxForImage from './LightboxForImage';
import '../App.css';
import socket from './socket';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { useHandleStreamEnd, useHandleMessageLimitReached, useStreamChunkHandler } from './CommonHooks'; 


function Chat() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [isPaneOpen, setIsPaneOpen] = useState(false);
  let { sessionId: urlSessionId } = useParams();
  let location = useLocation(); 
  const isHome = location.pathname === '/chat';
  const [currentSessionId, setCurrentSessionId] = useState(urlSessionId || null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const historyPaneRef = useRef(null);
  const [lastUserMessage, setLastUserMessage] = useState(null);
  const [isMoreDetailsState, setIsMoreDetailsState] = useState(false);
  const [isKeyInsightsState, setIsKeyInsightsState] = useState(false);
  const [isAnecdotesState, setIsAnecdotesState] = useState(false);
  const [isQuotesState, setIsQuotesState] = useState(false);
  const [bookTitleState, setBookTitleState] = useState(null);
  const [bookDataObjectIdState, setBookDataObjectIdState] = useState(null);
  const [authorState, setAuthorState] = useState(null);
  const [moreBooks, setMoreBooks] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const lightboxContentRef = useRef(null);
  const [lightboxContent, setLightboxContent] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAtBottomLightbox, setIsAtBottomLightbox] = useState(false);
 
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
    if (chatArea) {
      chatArea.addEventListener('scroll', handleScroll);
  
      return () => {
        chatArea.removeEventListener('scroll', handleScroll);
      };
    }
  }, []); // Depend on `currentSessionId` if changes to it should re-attach the listener
  

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
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/stop-stream`);
      setIsStreaming(false);
      
    } catch (error) {
      console.error('Error stopping the stream:', error);
    }
  }, []);

  useHandleStreamEnd(
    socket,
    () => currentSessionIdRef.current, // Getting the current session ID
    () => setIsStreaming(false) // Callback to execute when the stream ends
  );
  

  useStreamChunkHandler(
    socket,
    () => currentSessionIdRef.current, // Getting session ID from ref for Chat.js
    handleStopStreaming,
    setLightboxContent,
    setIsStreaming,
    setIsLightboxOpen,
    (content, moreBooks) => {
      updateSessionMessages(content, 'streamed', false, moreBooks);
      setIsStreaming(true);
    } 
  );

  useHandleMessageLimitReached(
    socket,
    () => currentSessionIdRef.current, // Getting the current session ID
    ({ content, sessionId }, currentSessionId) => {
      if (currentSessionId === sessionId) {
        updateSessionMessages(content, 'streamed', false, null);
      }
    }
  );
  
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
        isQuotes: isQuotesState,
        bookDataObjectId: bookDataObjectIdState,
        bookTitle: bookTitleState,
        author: authorState,
        moreBooks: moreBooks,
        isEdit: isEdit
      });
      // Reset lastUserMessage to avoid duplicate emissions
      setLastUserMessage(null);
    }
    
  }, [lastUserMessage, sessions, isMoreDetailsState, isKeyInsightsState, isAnecdotesState, isQuotesState, bookTitleState, bookDataObjectIdState, authorState, moreBooks, isEdit]);
  
  const handleQuerySubmit = async (query, isMoreDetails = false, bookDataObjectId = null, bookTitle = null, author = null, moreBooks = false, isKeyInsights = false, isAnecdotes = false, isQuotes = false, isEdit = false) => {
    setIsLoading(true);
  
    // Get the current session's ID
    const currentSessionId = currentSessionIdRef.current;
    let currentSession;

    // If there's no current session ID, create a new session
    if (!currentSessionId) {
      currentSession = await handleNewSession();
    } else {
      currentSession = sessions.find(session => session._id === currentSessionId);
    }
    
    const isFirstQuery = currentSession?.messages?.length === 0;

    setIsMoreDetailsState(isMoreDetails);
    setIsKeyInsightsState(isKeyInsights);
    setIsAnecdotesState(isAnecdotes);
    setIsQuotesState(isQuotes);
    setBookDataObjectIdState(bookDataObjectId);
    setBookTitleState(bookTitle);
    setAuthorState(author);
    setMoreBooks(moreBooks);
    setIsEdit(isEdit);

    if (!isMoreDetails && !moreBooks && !isKeyInsights && !isAnecdotes && !isQuotes && !isEdit) {
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
        isQuotes,
        bookDataObjectId,
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
        navigate(`/chat/${lastSessionId}`); // Navigate to the session URL
        setSelectedSessionId(lastSessionId);
        return sessions[sessions.length - 1];
      } else {
        try {
          if (!userData) {
            return;
          } 
          const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/session`, { userId: userData.id });
          const newSession = res.data;
          setSessions(prevSessions => [...prevSessions, newSession]);
          setCurrentSessionId(newSession._id);
          currentSessionIdRef.current = newSession._id;
          setSelectedSessionId(newSession._id);
          navigate(`/chat/${newSession._id}`); // Navigate to the new session URL
          return newSession;
        } catch (error) {
          console.error('Error creating new session:', error);
        }
      }
  }, [userData, sessions, navigate]); // Add navigate as a dependency

  useEffect(() => {
    // Directly setting urlSessionId obtained from useParams
    if (urlSessionId) {
      setCurrentSessionId(urlSessionId); // This might be redundant if you do not need to track currentSessionId separately from selectedSessionId
      setSelectedSessionId(urlSessionId);
      currentSessionIdRef.current = urlSessionId;
    }
    else {
      setCurrentSessionId(null); // This might be redundant if you do not need to track currentSessionId separately from selectedSessionId
      setSelectedSessionId(null);
      currentSessionIdRef.current = null;
    }
  }, [urlSessionId]); 

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
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/sessions`, { params: { userId: currentUserData.id } }); // Changed from _id to .id
      setSessions(res.data);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, []); 

  useEffect(() => {
    checkAuthStatus().then((userData) => {
      if (userData) {
        setUserData(userData);
        loadSessions(userData);
      }
    });
  }, [loadSessions, setUserData]);

  const handleDeleteSession = async (sessionId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/session/${sessionId}`);
      setSessions(prevSessions => prevSessions.filter(session => session._id !== sessionId));
  
      // Update the current session ID after deletion
      setCurrentSessionId(prevCurrentSessionId => {
        if (prevCurrentSessionId === sessionId) {
          navigate(`/chat`);
          return null;
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

  const wrappedHandleAnecdotesRequest = (bookDataObjectId, bookTitle, author) => {
    handleAnecdotesRequest(
      bookDataObjectId,
      bookTitle,
      author,
      handleQuerySubmit,
      setIsLightboxOpen,
      setLightboxContent
    );
  };

  const wrappedHandleQuotesRequest = (bookDataObjectId, bookTitle, author) => {
    handleQuotesRequest(
      bookDataObjectId,
      bookTitle,
      author,
      handleQuerySubmit,
      setIsLightboxOpen,
      setLightboxContent
    );
  };

  const wrappedHandleKeyInsightsRequest = (bookDataObjectId, bookTitle, author) => {
    handleKeyInsightsRequest(
      bookDataObjectId,
      bookTitle,
      author,
      handleQuerySubmit,
      setIsLightboxOpen,
      setLightboxContent
    );
  };

  const wrappedHandleMoreDetailsRequest = (bookDataObjectId, bookTitle, author) => {
    handleMoreDetailsRequest(
      bookDataObjectId,
      bookTitle,
      author,
      handleQuerySubmit,
      setIsLightboxOpen,
      setLightboxContent
    );
  };

  const [showContinueButton, setShowContinueButton] = useState(false);

  function extractTags(content) {
    // console.log("content is", content);
    // Initialize the array to store extracted book titles and authors
    const bookDetails = [];
  
    // Regex to match each book section in the content
    const bookInfoMatches = content.match(/<div class="book-info">[\s\S]*?<\/div><\/div><\/div>/g) || [];
    bookInfoMatches.forEach((bookInfo, index) => {
      // Extract the book title
      const titleMatch = bookInfo.match(/<strong class="book-title">(.*?)<\/strong>/);
      const title = titleMatch ? titleMatch[1].trim() : '';
  
      // Extract the book author, removing the 'by ' prefix correctly
      const authorMatch = bookInfo.match(/<div class="book-author">by (.*?)<\/div>/);
      const author = authorMatch ? authorMatch[1].trim() : '';
  
      // Combine title and author with numbering
      if (title && author) {
        bookDetails.push(`${index + 1}. ${title} - ${author}`);
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

        handleQuerySubmit(concatenatedContent, false, null, null, null, true);
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
            // console.log(bookCount);
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

  // Message-question edit functionality

  const handleEditMessage = async (sessionId, messageId, newContent) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/session/${sessionId}/edit-message/${messageId}`, { newContent });
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
        handleQuerySubmit(newContent, false, null, null, null, false, false, false, false, true);
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };
  
  return (
      <div className="chat-page">
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
        <HistoryPane
          ref={historyPaneRef}
          sessions={sessions}
          onSelectSession={setCurrentSessionIdWithStreamCheck}
          onDeleteSession={handleDeleteSession}
          userName={userData?.name}
          userImage={userData?.image}
          isPaneOpen={isPaneOpen}
          togglePane={togglePane}
          selectedSessionId={selectedSessionId}
          setSelectedSessionId={setSelectedSessionId}
        />
        <Header isPaneOpen={isPaneOpen} togglePane={togglePane} />

        {isHome && userData && userData.country ? (
          <Home userData={userData} />
        ) : (
          <div className="chat-area" ref={chatAreaRef}>
            {/* {location.pathname === "/chat" && (
              <div className="chat-heading">
                Discover Your Next Great Read!
              </div>
            )} */}

            {sessions.find(session => session._id === selectedSessionId)?.messages.map((msg, index, messageArray) => {
            const isLastMessage = index === messageArray.length - 1;
            const isLastMessageFromAssistant = isLastMessage && msg.role === 'assistant';
            return (
              <AnswerDisplay
                key={msg._id} // Assuming msg._id is a unique identifier
                role={msg.role}
                content={msg.content}
                userImage={userData?.image}
                isStreaming={isStreaming}
                onMoreDetailsClick={wrappedHandleMoreDetailsRequest}
                onKeyInsightsClick={wrappedHandleKeyInsightsRequest}
                onAnecdotesClick={wrappedHandleAnecdotesRequest}
                onQuotesClick={wrappedHandleQuotesRequest}
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
        )}
        <InputBox
          onSubmit={handleQuerySubmit}
          isLoading={isLoading}
          isStreaming={isStreaming}
          onStopStreaming={handleStopStreaming}
          isPaneOpen={isPaneOpen} 
        />
      </div>
  );
}

export default Chat;