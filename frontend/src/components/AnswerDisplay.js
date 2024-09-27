import React, { useCallback, useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { handleActionButtonClick } from './CommonFunctions';
import '../App.css';


function AnswerDisplay({ 
  role, content, userImage, userEmail, isStreaming, 
  onMoreDetailsClick, onKeyInsightsClick, onAnecdotesClick, onQuotesClick, showContinueButton, onContinueGenerating, onImageClick, onEditMessage, sessionId, messageId, isAdmin 
}) { 
  
  const [isKeyInsightsClicked, setIsKeyInsightsClicked] = useState(false);
  const [isMoreDetailsClicked, setIsMoreDetailsClicked] = useState(false);
  const [isAnecdotesClicked, setIsAnecdotesClicked] = useState(false);
  const [isQuotesClicked, setIsQuotesClicked] = useState(false);
  const [isPreviewClicked, setIsPreviewClicked] = useState(false);
  const [isContinueGeneratingClicked, setIsContinueGeneratingClicked] = useState(false);

  const createMarkup = () => {
    let modifiedContent = content;
  
    // Check if the content contains image-container
    const containsImageContainer = content.includes('class="image-container"');
    if (!containsImageContainer) {
      // Add the 'no-image' class to buttons-container if image-container is not present
      modifiedContent = modifiedContent.replace('class="buttons-container"', 'class="buttons-container no-image"');
    }
  
    const safeHTML = DOMPurify.sanitize(modifiedContent, {
      ADD_ATTR: ['target'], // Allow 'target' attribute for anchor tags
    });
    return { __html: safeHTML };
  };

  const extractBookData = (bookDataObjectId, actionButtonClass) => {
    const button = document.querySelector(`[data-bookdataobjectid="${bookDataObjectId}"].${actionButtonClass}`);
    const contentContainer = button.closest('.content-container');
    const bookImage = contentContainer.querySelector('.image-container img').src;
    const buyNowButton = contentContainer.querySelector('.buttons-container a');
    const amazonLink = buyNowButton.href;
    const buyNowButtonText = buyNowButton.textContent.trim(); 

    const ratingsContainer = contentContainer.previousElementSibling.querySelector('.ratings-and-review');
    const starsContainer = ratingsContainer.querySelector('.star-rating');
    const fullStars = starsContainer.querySelectorAll('.fa-solid.fa-star').length;
    const halfStars = starsContainer.querySelectorAll('.fa-solid.fa-star-half-stroke').length;
    const numericRating = fullStars + (halfStars * 0.5);
    const amazonReviewCount = ratingsContainer.querySelector('.review-count').textContent;
  
    return {
      bookImage,
      amazonLink,
      amazonStarRating: numericRating,
      amazonReviewCount,
      buyNowButtonText
    };
  };
  
  const handleKeyInsightsClick = (bookDataObjectId, bookTitle, author) => {
    if (!isKeyInsightsClicked && onKeyInsightsClick) {
      setIsKeyInsightsClicked(true);
      
      const bookData = extractBookData(bookDataObjectId, 'key-insights-btn');
      onKeyInsightsClick(bookDataObjectId, bookTitle, author, bookData);
      handleActionButtonClick('key-insights-btn', bookTitle, author, userEmail);

      const trimmedInput = `Provide key insights of the book - ${bookTitle} by ${author}`;

      if (!isAdmin && process.env.REACT_APP_ENV !== 'local') {
        window.fbq && window.fbq('track', 'Search', {
          search_string: trimmedInput
        });
      }

      // Reset the state after a delay
      setTimeout(() => {
        setIsKeyInsightsClicked(false);
      }, 3500); 
    }
  };
  
  const handleMoreDetailsClick = (bookDataObjectId, bookTitle, author) => {
    if (!isMoreDetailsClicked && onMoreDetailsClick) {
      setIsMoreDetailsClicked(true);
      
      const bookData = extractBookData(bookDataObjectId, 'more-details-btn');
      onMoreDetailsClick(bookDataObjectId, bookTitle, author, bookData);
      handleActionButtonClick('more-details-btn', bookTitle, author, userEmail);

      const trimmedInput = `Provide summary of the book - ${bookTitle} by ${author}`;

      if (!isAdmin && process.env.REACT_APP_ENV !== 'local') {
        window.fbq && window.fbq('track', 'Search', {
          search_string: trimmedInput
        });
      }

      setTimeout(() => {
        setIsMoreDetailsClicked(false);
      }, 3500); // Adjust the delay as needed
    }
  };
  
  const handleAnecdotesClick = (bookDataObjectId, bookTitle, author) => {
    if (!isAnecdotesClicked && onAnecdotesClick) {
      setIsAnecdotesClicked(true);
      
      const bookData = extractBookData(bookDataObjectId, 'anecdotes-btn');
      onAnecdotesClick(bookDataObjectId, bookTitle, author, bookData);
      handleActionButtonClick('anecdotes-btn', bookTitle, author, userEmail);

      const trimmedInput = `Provide anecdotes from the book - ${bookTitle} by ${author}`;

      if (!isAdmin && process.env.REACT_APP_ENV !== 'local') {
        window.fbq && window.fbq('track', 'Search', {
          search_string: trimmedInput
        });
      }

      setTimeout(() => {
        setIsAnecdotesClicked(false);
      }, 3500); // Adjust the delay as needed
    }
  };

  const handleQuotesClick = (bookDataObjectId, bookTitle, author) => {
    if (!isQuotesClicked && onQuotesClick) {
      setIsQuotesClicked(true);

      const bookData = extractBookData(bookDataObjectId, 'quotes-btn');
      onQuotesClick(bookDataObjectId, bookTitle, author, bookData);
      handleActionButtonClick('quotes-btn', bookTitle, author, userEmail);

      const trimmedInput = `Provide quotes from the book - ${bookTitle} by ${author}`;

      if (!isAdmin && process.env.REACT_APP_ENV !== 'local') {
        window.fbq && window.fbq('track', 'Search', {
          search_string: trimmedInput
        });
      }

      setTimeout(() => {
        setIsQuotesClicked(false);
      }, 3500); // Adjust the delay as needed
    }
  };

  const handlePreviewClick = (previewLink, bookTitle, author) => {
    if (!isPreviewClicked) {
      setIsPreviewClicked(true);
      
      if (previewLink) {
        window.open(previewLink, '_blank');
      }
      handleActionButtonClick('preview-btn', bookTitle, author, userEmail);
  
      setTimeout(() => {
        setIsPreviewClicked(false);
      }, 3500); // Adjust the delay as needed
    }
  };


  const handleBuyNowClick = async (bookTitle, author) => {
    await handleActionButtonClick('buy-now-btn', bookTitle, author, userEmail);

    const trimmedInput = `To buy the book - ${bookTitle} by ${author}`;

    if (!isAdmin && process.env.REACT_APP_ENV !== 'local') {
      window.fbq && window.fbq('track', 'Search', {
        search_string: trimmedInput
      });
    }
  };

  
  const handleContinueGenerating = () => {
    if (!isContinueGeneratingClicked && onContinueGenerating) {
      setIsContinueGeneratingClicked(true);
      
      onContinueGenerating();
  
      setTimeout(() => {
        setIsContinueGeneratingClicked(false);
      }, 3500); // Adjust the delay as needed
    }
  };  

  const messageAnswerRef = useRef(null);  

  useEffect(() => {
    // Check the number of buttons inside the message-answer after each render
    const messageAnswer = messageAnswerRef.current;
    if (messageAnswer) {
      const buttons = messageAnswer.getElementsByTagName('button');
      if (buttons.length === 1) {
        // Add a specific class to the single button
        buttons[0].classList.add('single-button');
      } else {
        Array.from(buttons).forEach(button => {
          // Remove the class if more than one button is present
          button.classList.remove('single-button');
        });
      }
    }
  });

  const handleImageClick = (src) => {
    onImageClick(src); // Propagate the click event and image source up to the parent component
  };

  // Edit mode

  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(content);

  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditableContent(content); // Reset the content to original if cancel is clicked
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onEditMessage) {
      onEditMessage(sessionId, messageId, editableContent); // Call the edit message function
    }
  };

  const handleTextChange = (e) => {
    setEditableContent(e.target.value);
    adjustHeight(e.target);
  };
  
  const sanitizeIdForClass = (id) => {
    if (typeof id === 'string') {
      return `msg-${id.replace(/[^a-zA-Z0-9]/g, '-')}`;
    } else {
      return ''; // or some default string value
    }
  };
  
  const [messageQuestionHeight, setMessageQuestionHeight] = useState(null);

  useEffect(() => {
    if (!isEditing) {
      const sanitizedId = sanitizeIdForClass(messageId);
      if (sanitizedId) {
        const messageQuestion = document.querySelector(`.${sanitizedId} .message-question`);
        if (messageQuestion) {
          setMessageQuestionHeight(messageQuestion.offsetHeight);
        }
      }
    }
  }, [isEditing, messageId]);

  const adjustHeight = useCallback(() => {
    if (isEditing && messageQuestionHeight !== null) {
      const sanitizedId = sanitizeIdForClass(messageId);
      if (sanitizedId) {
        const textarea = document.querySelector(`.${sanitizedId} textarea`);
        if (textarea) {
          textarea.style.height = `${messageQuestionHeight}px`;
        }
      }
    }
  }, [isEditing, messageQuestionHeight, messageId]);
  
  useEffect(() => {
    if (isEditing) {
      adjustHeight();
    }
  }, [isEditing, adjustHeight]);

  return (
    <div className={`chat-area-wrapper ${isStreaming ? 'streaming' : ''}`}>
      <div className={`message ${sanitizeIdForClass(messageId)} ${role}`}>
        <div className="message-icon">
          {role === 'user' ? (
            userImage ? (
              <div><img src={userImage} alt="" className="display-image" /></div> // Display user image
              
            ) : (
              <span><i class="fa-solid fa-user"></i></span> // Fallback if no image is available
            )
          ) : (
            <div><img src="/GetBooks_64_64.png" className="display-image" alt="" /></div> // Icon for the assistant
          )}
        </div>
        <div className="message-content" onClick={(e) => {
          if (e.target.classList.contains('more-details-btn')) {
            const bookTitle = e.target.getAttribute('data-book-title');
            const bookDataObjectId = e.target.getAttribute('data-bookDataObjectId');
            const author = e.target.getAttribute('data-author');
            handleMoreDetailsClick(bookDataObjectId, bookTitle, author);
          } else if (e.target.classList.contains('key-insights-btn')) {
            const bookTitle = e.target.getAttribute('data-book-title');
            const bookDataObjectId = e.target.getAttribute('data-bookDataObjectId');
            const author = e.target.getAttribute('data-author');
            handleKeyInsightsClick(bookDataObjectId, bookTitle, author);
          } else if (e.target.classList.contains('anecdotes-btn')) {
            const bookTitle = e.target.getAttribute('data-book-title');
            const bookDataObjectId = e.target.getAttribute('data-bookDataObjectId');
            const author = e.target.getAttribute('data-author');
            handleAnecdotesClick(bookDataObjectId, bookTitle, author);
          } else if (e.target.classList.contains('quotes-btn')) {
            const bookTitle = e.target.getAttribute('data-book-title');
            const bookDataObjectId = e.target.getAttribute('data-bookDataObjectId');
            const author = e.target.getAttribute('data-author');
            handleQuotesClick(bookDataObjectId, bookTitle, author);
          } else if (e.target.classList.contains('preview-btn')) {
            const previewLink = e.target.getAttribute('data-preview-link');
            const bookTitle = e.target.getAttribute('data-book-title');
            const author = e.target.getAttribute('data-author');
            handlePreviewClick(previewLink, bookTitle, author);
          } else if (e.target.classList.contains('buy-now-button')) {
            const bookTitle = e.target.getAttribute('data-book-title');
            const author = e.target.getAttribute('data-author');
            handleBuyNowClick(bookTitle, author);
          } 
        }}>
          {role === 'user' && (
            <>
              <div className="message-sender">You</div>
              <br></br>
              {isEditing ? (
                <textarea 
                  className="answer-display-textarea"
                  value={editableContent}
                  onChange={handleTextChange} 
                />
              ) : (
                <div className="message-question-container">
                  <div className="message-question">
                    {editableContent}
                  </div>
                  {!isEditing && (
                    <i className="fa-solid fa-pen" onClick={handleEditClick}></i>
                  )}
                </div> 
              )}
              {isEditing && (
                <div className="button-container">
                  <button onClick={handleSave} className="save-button">Save</button>
                  <button onClick={handleCancel} className="cancel-button">Cancel</button>
                </div>
              )}
            </>
          )}
          {role === 'assistant' && (
            <>
              <div className="message-sender">GetBooks.ai</div>
              <br></br>
              <div className="message-answer" 
                ref={messageAnswerRef} 
                dangerouslySetInnerHTML={createMarkup()} 
                onClick={(e) => {
                  if (e.target.tagName === 'IMG') {
                    handleImageClick(e.target.src);
                  }
                }}
              />
              {showContinueButton && !isStreaming && (
                <div className="button-container-continue-generating-btn">
                  <button className="continue-generating-btn" onClick={handleContinueGenerating}>
                    <i className="fa-solid fa-forward"></i> More books
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
    </div>
  );
}

export default AnswerDisplay;

