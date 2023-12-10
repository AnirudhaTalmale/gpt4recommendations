// openaiApi.js
const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const openaiApi = async (messages, socket, session) => {
  const filteredMessages = messages.map(({ role, content }) => ({ role, content }));

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages: filteredMessages,
      stream: true,
    });

    let completeResponse = "";
    for await (const chunk of stream) {
      let chunkContent = chunk.choices[0]?.delta?.content || "";
      completeResponse += chunkContent;
      socket.emit('chunk', chunkContent);
    }

    // Add the assistant's response to the session here
    session.messages.push({
      role: 'assistant',
      contentType: 'simple',
      content: completeResponse
    });

    await session.save();

  } catch (error) {
    console.error('openaiApi - Error calling OpenAI API:', error);
    throw error;
  }
};


module.exports = openaiApi;
