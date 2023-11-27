// apiService.js
import axios from 'axios';

// Updated to handle a single query string
export const sendQuery = async (query) => {
  try {
    // Call the backend API to send the query to OpenAI
    const response = await axios.post(`http://localhost:3000/api/query`, {
      messages: [{ role: 'user', content: query }] // Wrap the single query in an array to match the expected format
    });
    // Return the response from OpenAI
    return response.data.response;
  } catch (error) {
    console.error('Error sending query to backend:', error);
    throw error;
  }
};
