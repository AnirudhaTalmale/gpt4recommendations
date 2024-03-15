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
      const userQuery = `${bookTitle}`;
      handleQuerySubmit(userQuery, false, isbn, bookTitle, author, false, false, true);
    } else {
      setLightboxContent(''); // Reset the content
      setLightboxContent(anecdotes);
      setIsLightboxOpen(true);
    }
  } catch (error) {
    const userQuery = `${bookTitle}`;
    handleQuerySubmit(userQuery, false, isbn, bookTitle, author, false, false, true);
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
      const userQuery = `${bookTitle}`;
      handleQuerySubmit(userQuery, false, isbn, bookTitle, author, false, true);
    } else {
      setLightboxContent(''); // Reset the content
      setLightboxContent(keyInsights);
      setIsLightboxOpen(true);
    }
  } catch (error) {
    const userQuery = `${bookTitle}`;
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
    const userQuery = `Explain the book - ${bookTitle}`;
    handleQuerySubmit(userQuery, true, isbn, bookTitle, author);
  }
};
