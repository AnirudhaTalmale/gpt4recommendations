// apiService.js
import axios from 'axios';

export const sendQuery = async (sessionId, content) => {
  console.log('Sending query with sessionId:', sessionId);
  console.log('Content being sent:', content);
  try {
    // Sending the query to the backend
    const response = await axios.post(`http://localhost:3000/api/query`, {
      sessionId: sessionId,
      message: {
        role: 'user',
        content: content
      }
    });
    console.log('Response from backend:', response.data);

    // Returning the response received from the backend
    return response.data.response;
  } catch (error) {
    console.error('Error in sendQuery:', error);
    throw error;
  }
};

