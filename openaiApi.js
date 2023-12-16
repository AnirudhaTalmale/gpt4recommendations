// openaiApi.js
const { OpenAI } = require('openai');
require('dotenv').config();

const axios = require('axios');

const getBookCover = async (title) => {
  try {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&key=${process.env.GOOGLE_BOOKS_API_KEY}`);
    const coverImageUrl = response.data.items[0]?.volumeInfo?.imageLinks?.thumbnail;
    return coverImageUrl || 'default-cover.jpg'; // Return a default cover image if none is found
  } catch (error) {
    console.error(`Error fetching book cover for ${title}:`, error);
    return 'default-cover.jpg';
  }
};

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const openaiApi = async (messages, socket, session) => {

  const filteredMessages = messages.map(({ role, content }) => ({ role, content }));
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: filteredMessages,
      stream: true,
    });

    // Create a new message entry for this stream.
    const messageIndex = session.messages.push({
      role: 'assistant',
      contentType: 'simple',
      content: ''
    }) - 1;
    await session.save();

    let completeResponse = "";
    let pausedEmit = ""; // Variable to hold paused chunks
    let isPaused = false; // Flag to check if emitting is paused

    for await (const chunk of stream) {
      let chunkContent = chunk.choices[0]?.delta?.content || "";
      console.log(chunkContent);

      if (chunkContent.includes('*')) {
        if (isPaused) {
          // If resuming, add current chunk to pausedEmit
          pausedEmit += chunkContent;

          // Extract book title enclosed in '*'
          const bookTitleMatch = pausedEmit.match(/\*(.*?)\*/);
          const bookTitle = bookTitleMatch ? bookTitleMatch[1] : "";

          // Fetch book cover image
          const coverImageUrl = await getBookCover(bookTitle);

          // Concatenate div tag with the book cover image tag
          const imageDiv = `<div><img src="${coverImageUrl}" alt="Book cover for ${bookTitle}"></div>`;
          pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookTitleMatch[0] + imageDiv);

          // Replace first and last '*' with <h3> and </h3>
          pausedEmit = pausedEmit.replace(/\*/g, "");
          
          // Emit pausedEmit and reset
          completeResponse += pausedEmit;
          // Update the current message with the new chunk.
          session.messages[messageIndex].content += pausedEmit;
          await session.save();
          socket.emit('chunk', pausedEmit);
          pausedEmit = "";
        } else {
          // If pausing, start adding to pausedEmit including current chunk
          pausedEmit += chunkContent;
        }
        isPaused = !isPaused; // Toggle pause state
      } else if (isPaused) {
        // If paused, accumulate chunk in pausedEmit
        pausedEmit += chunkContent;
      } else {
        // Normal emit when not paused
        completeResponse += chunkContent;
        // Update the current message with the new chunk.
        session.messages[messageIndex].content += chunkContent;
        await session.save();
        socket.emit('chunk', chunkContent);
      }
    }

  } catch (error) {
    console.error('openaiApi - Error calling OpenAI API:', error);
    throw error;
  }
};


module.exports = openaiApi;