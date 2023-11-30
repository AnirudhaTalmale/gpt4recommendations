// openaiApi.js
const axios = require('axios');
require('dotenv').config(); 

const openaiApi = async (messages) => {
  // Map through the messages and pick only the necessary fields
  const filteredMessages = messages.map(({ role, content }) => ({ role, content }));

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4",
      messages: filteredMessages, // Send the filtered messages
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    console.log('openaiApi - Response from OpenAI API:', response.data);
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('openaiApi - Error calling OpenAI API:', error);
    throw error; // Throw the error instead of returning null
  }
};



module.exports = openaiApi; 