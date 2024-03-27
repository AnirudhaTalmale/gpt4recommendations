import axios from 'axios';

export const fetchAnecdotes = async (isbn, bookTitle) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/anecdotes`, {
      params: { isbn, bookTitle }
    });
    return response.data.anecdotes; 
  } catch (error) {
    throw error; 
  }
};  

export const handleAnecdotesRequest = async (isbn, bookTitle, author, handleQuerySubmit, setIsLightboxOpen, setLightboxContent) => {
  try {
    const anecdotes = await fetchAnecdotes(isbn, bookTitle);
    if (!anecdotes) {
      const userQuery = `${bookTitle} by ${author}`;
      handleQuerySubmit(userQuery, false, isbn, bookTitle, author, false, false, true);
    } else {
      setLightboxContent(''); // Reset the content
      setLightboxContent(anecdotes);
      setIsLightboxOpen(true);
    }
  } catch (error) {
    const userQuery = `${bookTitle} by ${author}`;
    handleQuerySubmit(userQuery, false, isbn, bookTitle, author, false, false, true);
  }
};

export const fetchQuotes = async (isbn, bookTitle) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/quotes`, {
        params: { isbn, bookTitle }
      });
      return response.data.quotes; 
    } catch (error) {
      throw error; 
    }
  };  
  
  export const handleQuotesRequest = async (isbn, bookTitle, author, handleQuerySubmit, setIsLightboxOpen, setLightboxContent) => {
    try {
      const quotes = await fetchQuotes(isbn, bookTitle);
      if (!quotes) {
        const userQuery = `${bookTitle} by ${author}`;
        handleQuerySubmit(userQuery, false, isbn, bookTitle, author, false, false, false, true);
      } else {
        setLightboxContent(''); // Reset the content
        setLightboxContent(quotes);
        setIsLightboxOpen(true);
      }
    } catch (error) {
      const userQuery = `${bookTitle} by ${author}`;
      handleQuerySubmit(userQuery, false, isbn, bookTitle, author, false, false, false, true);
    }
  };

export const fetchKeyInsights = async (isbn, bookTitle) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/key-insights`, {
      params: { isbn, bookTitle }
    });
    return response.data.keyInsights; 
  } catch (error) {
    throw error;
  }
};

export const handleKeyInsightsRequest = async (isbn, bookTitle, author, handleQuerySubmit, setIsLightboxOpen, setLightboxContent) => {
  try {
    const keyInsights = await fetchKeyInsights(isbn, bookTitle);
    if (!keyInsights) {
      const userQuery = `${bookTitle} by ${author}`;
      handleQuerySubmit(userQuery, false, isbn, bookTitle, author, false, true);
    } else {
      setLightboxContent(''); // Reset the content
      setLightboxContent(keyInsights);
      setIsLightboxOpen(true);
    }
  } catch (error) {
    const userQuery = `${bookTitle} by ${author}`;
    handleQuerySubmit(userQuery, false, isbn, bookTitle, author, false, true);
  }
};

export const fetchMoreDetails = async (isbn, bookTitle) => {
  try {
    
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/more-details`, {
      params: { isbn, bookTitle }
    });
    return response.data.detailedDescription; 
  } catch (error) {
    console.log("unable to fetchMoreDetails ")
  }
};

export const handleMoreDetailsRequest = async (isbn, bookTitle, author, handleQuerySubmit, setIsLightboxOpen, setLightboxContent) => {
  try {
    const detailedDescription = await fetchMoreDetails(isbn, bookTitle);
    if (!detailedDescription) {
      const userQuery = `Explain the book - ${bookTitle} by ${author}`;
      handleQuerySubmit(userQuery, true, isbn, bookTitle, author);
    } else {
      setLightboxContent(''); // Reset the content
      setLightboxContent(detailedDescription);
      setIsLightboxOpen(true);
    }
  } catch (error) {
    const userQuery = `Explain the book - ${bookTitle} by ${author}`;
    handleQuerySubmit(userQuery, true, isbn, bookTitle, author);
  }
};

export const checkAuthStatus = async () => {
    try {
      const authResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/check-auth`, { withCredentials: true });
  
      if (authResponse.status === 200 && authResponse.data.isAuthenticated) {
        if (!authResponse.data.onboardingComplete) {
          window.location.href = `${process.env.REACT_APP_FRONTEND_URL}/onboarding`;
          return;
        }
  
        const userInfoResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user-info`, { withCredentials: true });
  
        if (userInfoResponse.status === 200) {
          return userInfoResponse.data.user; // You might want to return the user data for further use
        }
      } else {
        console.log("Authentication failed, redirecting to login page");
        window.location.href = `${process.env.REACT_APP_FRONTEND_URL}/auth/login`;
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      window.location.href = `${process.env.REACT_APP_FRONTEND_URL}/auth/login`;
    }
  };
  

  export const handleBookPreviewRequest = async (bookId, setIsLightboxOpen, setBookIdForPreview, isViewerLoaded) => {
    try {
      if (isViewerLoaded && bookId) {
        setBookIdForPreview(bookId); // Assuming this function updates the state with the book ID to preview
        setIsLightboxOpen(true); // Open the Lightbox
      } else {
        console.log("Viewer is not loaded or book ID is unavailable");
      }
    } catch (error) {
      console.error("Error handling book preview request:", error);
    }
  };

  export const renderStarRating = (rating) => {
    let stars = [];
    for (let i = 0; i < Math.floor(rating); i++) {
      stars.push(<i key={`star-${i}`} className="fa fa-star full-star-book-gallery" style={{color: 'orange', fontSize: '0.9rem'}}></i>);
    }
    if (rating % 1 !== 0) {
      stars.push(<i key="half-star" className="fa fa-star-half-stroke half-star-book-gallery" style={{color: 'orange', fontSize: '0.9rem'}}></i>);
    }
    return <div style={{display: 'flex', alignItems: 'center', marginRight: '10px'}}>{stars}</div>;
  };