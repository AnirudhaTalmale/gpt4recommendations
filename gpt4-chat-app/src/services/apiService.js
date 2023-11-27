import axios from 'axios';

export const sendQuery = async (messages) => {
  try {
    const response = await axios.post(`http://localhost:3000/api/query`, { messages });
    return response.data.response;
  } catch (error) {
    console.error('Error sending query to backend:', error);
    throw error;
  }
};