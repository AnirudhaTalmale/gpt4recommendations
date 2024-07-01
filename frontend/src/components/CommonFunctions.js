import axios from 'axios';

export const fetchAnecdotes = async (bookDataObjectId, bookTitle) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/anecdotes`, {
      params: { bookDataObjectId, bookTitle }
    });
    return response.data.anecdotes; 
  } catch (error) {
    throw error; 
  }
};  

export const handleAnecdotesRequest = async (bookDataObjectId, bookTitle, author, handleQuerySubmit, setIsLightboxOpen, setLightboxContent) => {
  try {
    const anecdotes = await fetchAnecdotes(bookDataObjectId, bookTitle);
    if (!anecdotes) {
      const userQuery = `${bookTitle} by ${author}`;
      handleQuerySubmit(userQuery, false, bookDataObjectId, bookTitle, author, false, false, true);
    } else {
      setLightboxContent(''); // Reset the content
      setLightboxContent(anecdotes);
      setIsLightboxOpen(true);
    }
  } catch (error) {
    const userQuery = `${bookTitle} by ${author}`;
    handleQuerySubmit(userQuery, false, bookDataObjectId, bookTitle, author, false, false, true);
  }
};

export const fetchQuotes = async (bookDataObjectId, bookTitle) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/quotes`, {
        params: { bookDataObjectId, bookTitle }
      });
      return response.data.quotes; 
    } catch (error) {
      throw error; 
    }
  };  
  
  export const handleQuotesRequest = async (bookDataObjectId, bookTitle, author, handleQuerySubmit, setIsLightboxOpen, setLightboxContent) => {
    try {
      const quotes = await fetchQuotes(bookDataObjectId, bookTitle);
      if (!quotes) {
        const userQuery = `${bookTitle} by ${author}`;
        handleQuerySubmit(userQuery, false, bookDataObjectId, bookTitle, author, false, false, false, true);
      } else {
        setLightboxContent(''); // Reset the content
        setLightboxContent(quotes);
        setIsLightboxOpen(true);
      }
    } catch (error) {
      const userQuery = `${bookTitle} by ${author}`;
      handleQuerySubmit(userQuery, false, bookDataObjectId, bookTitle, author, false, false, false, true);
    }
  };

export const fetchKeyInsights = async (bookDataObjectId, bookTitle) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/key-insights`, {
      params: { bookDataObjectId, bookTitle }
    });
    return response.data.keyInsights; 
  } catch (error) {
    throw error;
  }
};

export const handleKeyInsightsRequest = async (bookDataObjectId, bookTitle, author, handleQuerySubmit, setIsLightboxOpen, setLightboxContent) => {
  try {
    const keyInsights = await fetchKeyInsights(bookDataObjectId, bookTitle);
    if (!keyInsights) {
      const userQuery = `${bookTitle} by ${author}`;
      handleQuerySubmit(userQuery, false, bookDataObjectId, bookTitle, author, false, true);
    } else {
      setLightboxContent(''); // Reset the content
      setLightboxContent(keyInsights);
      setIsLightboxOpen(true);
    }
  } catch (error) {
    const userQuery = `${bookTitle} by ${author}`;
    handleQuerySubmit(userQuery, false, bookDataObjectId, bookTitle, author, false, true);
  }
};

export const fetchMoreDetails = async (bookDataObjectId, bookTitle) => {
  try {
    
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/more-details`, {
      params: { bookDataObjectId, bookTitle }
    });
    return response.data.detailedDescription; 
  } catch (error) {
    console.log("unable to fetchMoreDetails ")
  }
};

export const handleMoreDetailsRequest = async (bookDataObjectId, bookTitle, author, handleQuerySubmit, setIsLightboxOpen, setLightboxContent) => {
  try {
    const detailedDescription = await fetchMoreDetails(bookDataObjectId, bookTitle);
    if (!detailedDescription) {
      const userQuery = `Explain the book - ${bookTitle} by ${author}`;
      handleQuerySubmit(userQuery, true, bookDataObjectId, bookTitle, author);
    } else {
      setLightboxContent(''); // Reset the content
      setLightboxContent(detailedDescription);
      setIsLightboxOpen(true);
    }
  } catch (error) {
    const userQuery = `Explain the book - ${bookTitle} by ${author}`;
    handleQuerySubmit(userQuery, true, bookDataObjectId, bookTitle, author);
  }
};

  export const checkAuthStatus = async () => {
    try {
      const authResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/check-auth`, { withCredentials: true });
  
      if (authResponse.status === 200 && authResponse.data.isAuthenticated) {
        if (!authResponse.data.onboardingComplete) {
          const onboardingUrl = new URL(`${process.env.REACT_APP_FRONTEND_URL}/onboarding`);
          
          // Append the verification token to the URL
          if (authResponse.data.verificationToken) {
            onboardingUrl.searchParams.append('token', authResponse.data.verificationToken);
          }
          
          // Append the display name to the URL if it exists
          if (authResponse.data.displayName) {
            onboardingUrl.searchParams.append('displayName', authResponse.data.displayName);
          }
        
          // You could also append the flags for hasDisplayName and hasCountry if needed
          if (authResponse.data.hasDisplayName) {
            onboardingUrl.searchParams.append('hasDisplayName', authResponse.data.hasDisplayName);
          }
          if (authResponse.data.hasCountry) {
            onboardingUrl.searchParams.append('hasCountry', authResponse.data.hasCountry);
          }
        
          // Redirect to the onboarding page with the appended parameters
          window.location.href = onboardingUrl.href;
          return;
        }        
  
        const userInfoResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user-info`, { withCredentials: true });
  
        if (userInfoResponse.status === 200) {
          const userData = userInfoResponse.data.user;
          return userData;
        }
      } else {
        console.log("Authentication failed, redirecting to login page");
        window.location.href = `${process.env.REACT_APP_FRONTEND_URL}/home`;
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      window.location.href = `${process.env.REACT_APP_FRONTEND_URL}/home`;
    }
  };

  export const renderStarRating = (rating) => {
    let stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const maxStars = 5;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        stars.push(<i key={`star-${i}`} className="fa-solid fa-star"></i>);
    }

    // Add half star if necessary
    if (hasHalfStar) {
        stars.push(<i key="half-star" className="fa-solid fa-star-half-stroke"></i>);
    }

    // Calculate remaining stars needed to make total of 5
    const totalStars = hasHalfStar ? fullStars + 1 : fullStars;
    for (let i = totalStars; i < maxStars; i++) {
        stars.push(<i key={`empty-star-${i}`} className="fa-regular fa-star"></i>);
    }

    return <div className="star-rating">{stars}</div>; 
};

// Button Components
export const BuyNowButton = ({ link, buttonText = 'Buy Now', userEmail }) => {
  const handleBuyClick = async () => {
    if (!userEmail) {
      console.error('User email is not provided');
      return;
    }

    try {

      // Call the API to increment the buy now click count, sending userEmail in the body
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/increment-buy-now`, {
        userEmail: userEmail
      });
      console.log('Buy now count incremented');
    } catch (error) {
      console.error('Error incrementing buy now count:', error);
    }
  };

  return (
    <div>
      <a href={link} target="_blank" rel="noreferrer">
        <button className="buy-now-button" onClick={handleBuyClick}>
          {buttonText}
        </button>
      </a>
    </div>
  );
};

export const PreviewButton = ({ previewLink, onClick }) => {
  // Define styles for disabled state
  const buttonStyles = previewLink ? {} : { cursor: 'not-allowed', opacity: 0.5, pointerEvents: 'none' };

  return (
    <div>
      <button type="button" 
              className="preview-btn" 
              style={buttonStyles} 
              disabled={!previewLink} 
              data-preview-link={previewLink || undefined}
              onClick={onClick}>
        Preview
      </button>
    </div>
  );
};

export const MoreDetailsButton = ({ bookDataObjectId, bookTitle, author, onClick }) => {
  return (
    <div>
      <button type="button" className="more-details-btn" 
              data-book-data-object-id={bookDataObjectId}
              data-book-title={bookTitle} 
              data-author={author}
              onClick={onClick}>
        Book Info
      </button>
    </div>
  );
};

export const KeyInsightsButton = ({ bookDataObjectId, bookTitle, author, onClick }) => {
  return (
    <div>
      <button type="button" className="key-insights-btn"
              data-book-data-object-id={bookDataObjectId}
              data-book-title={bookTitle}
              data-author={author}
              onClick={onClick}>
        Insights
      </button>
    </div>
  );
};

export const AnecdotesButton = ({ bookDataObjectId, bookTitle, author, onClick }) => {
  return (
    <div>
      <button type="button" className="anecdotes-btn"
              data-book-data-object-id={bookDataObjectId}
              data-book-title={bookTitle}
              data-author={author}
              onClick={onClick}>
        Anecdotes
      </button>
    </div>
  );
};

export const QuotesButton = ({ bookDataObjectId, bookTitle, author, onClick }) => {
  return (
    <div>
      <button type="button" className="quotes-btn"
              data-book-data-object-id={bookDataObjectId}
              data-book-title={bookTitle}
              data-author={author}
              onClick={onClick}>
        Quotes
      </button>
    </div>
  );
};

export const mapCountryNameToCode = (countryName) => {
  const countryMapping = {
      'India': 'IN',
      'United States': 'US'
  };

  return countryMapping[countryName] || null; // returns null if no match found
};

