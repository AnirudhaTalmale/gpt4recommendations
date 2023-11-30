// apiService.js
import axios from 'axios';

export const sendQuery = async (sessionId, content) => {
  console.log('Sending query with sessionId:', sessionId);
  console.log('Content being sent:', content);
  try {
    const response = await axios.post(`http://localhost:3000/api/query`, {
      sessionId: sessionId,
      message: {
        role: 'user', // Specify the role as expected by the backend
        content: content // The actual message content
      }
    });
    console.log('Response from backend:', response.data);
    return response.data.response;
  } catch (error) {
    console.error('Error in sendQuery:', error);
    throw error;
  }
};
