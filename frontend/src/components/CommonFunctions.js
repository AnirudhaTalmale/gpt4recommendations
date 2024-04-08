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
          window.gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID, {'user_id': userData.id.toString()});
          return userData;
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