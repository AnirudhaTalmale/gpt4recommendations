// openaiApi.js
const axios = require('axios');
require('dotenv').config(); 

const openaiApi = async (messages) => {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4",
      messages: messages, // Assume messages is an array of {role, content}
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Backend error calling OpenAI API:', error);
    return null;
  }
};

module.exports = openaiApi; 