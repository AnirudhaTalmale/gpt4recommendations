// openaiApi.js
const { OpenAI } = require('openai');
require('dotenv').config();

const axios = require('axios');
const Book = require('./models/Book');

const parseBookTitle = (bookTitleWithAuthor) => {
  // Remove any occurrences of opening or closing quotes
  const cleanedTitle = bookTitleWithAuthor.replace(/"/g, '');

  // Split the cleaned title into book title and author
  const splitTitle = cleanedTitle.split(' by ');
  const bookTitle = splitTitle[0];
  const author = splitTitle.length > 1 ? splitTitle[1] : null;

  return { bookTitle, author };
};

const encodeForUrl = (text) => encodeURIComponent(text);

const getBookCover = async (bookTitleWithAuthor) => {
  try {
    const { bookTitle, author } = parseBookTitle(bookTitleWithAuthor);

    // Check if the book cover is already in the database using bookTitle
    const existingBook = await Book.findOne({ title: bookTitle });
    if (existingBook) {
      existingBook.coverImageUrl = existingBook.coverImageUrl.replace("&edge=curl", "");
      return existingBook.coverImageUrl; // Return the cover image URL from the database
    }

    // Construct the query based on whether the author is available or not
    let query = `intitle:${encodeURIComponent(bookTitle)}`;
    if (author) {
      query += `+inauthor:${encodeURIComponent(author)}`;
    }

    // Update the API call to include the query
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${query}&key=${process.env.GOOGLE_BOOKS_API_KEY}`);

    // Check if items exist and are not empty
    if (response.data.items && response.data.items.length > 0) {
      const book = response.data.items[0];

      // Check if volumeInfo, imageLinks, and thumbnail exist
      if (book.volumeInfo && book.volumeInfo.imageLinks && book.volumeInfo.imageLinks.thumbnail) {
        let coverImageUrl = book.volumeInfo.imageLinks.thumbnail;
        coverImageUrl = coverImageUrl.replace("&edge=curl", "");

        // Save the new book cover in the database
        const newBook = new Book({ title: bookTitle, coverImageUrl });
        await newBook.save();

        // Return the cover image URL
        return coverImageUrl;
      }
    }

    // Return default cover image if no suitable image is found
    return 'default-cover.jpg';
  } catch (error) {
    console.error(`Error fetching book cover for ${bookTitleWithAuthor}:`, error);
    return 'default-cover.jpg';
  }
};

const openai = new OpenAI(process.env.OPENAI_API_KEY);

let isStreamingActive = false;

const openaiApi = async (messages, socket, session, sessionId, isMoreDetails, bookTitle, author) => {

  isStreamingActive = true;
  let buttonCounter = 1; 

  const filteredMessages = messages.map(({ role, content }) => ({ role, content }));
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: filteredMessages,
      stream: true,
    });

    let messageIndex;
    if(!isMoreDetails){
      // Create a new message entry for this stream.
      messageIndex = session.messages.push({
        role: 'assistant',
        contentType: 'simple',
        content: ''
      }) - 1;
      await session.save();
    }

    let completeResponse = "";
    let pausedEmit = ""; // Variable to hold paused chunks
    let isPaused = false; // Flag to check if emitting is paused

    for await (const chunk of stream) {
      if (!isStreamingActive) break; 
      let chunkContent = chunk.choices[0]?.delta?.content || "";
      // console.log(chunkContent);

      if (chunkContent.includes('*')) {
        if (isPaused) {
          // If resuming, add current chunk to pausedEmit
          pausedEmit += chunkContent;

          // Extract book title enclosed in '*'
          const bookTitleMatch = pausedEmit.match(/\*(.*?)\*/);
          const bookTitleWithAuthor = bookTitleMatch ? bookTitleMatch[1] : "";

          // Fetch book cover image
          const coverImageUrl = await getBookCover(bookTitleWithAuthor);
          
          // Extract book title and author
          let { bookTitle, author } = parseBookTitle(bookTitleWithAuthor);

          const encodedTitle = encodeForUrl(bookTitle);
          let amazonUrl = `https://www.amazon.in/s?k=${encodedTitle}`;

          if (author) {
            const encodedAuthor = `+by+${encodeForUrl(author)}`;
            amazonUrl += encodedAuthor;
          }

          // Replace buttonDiv1 with updated Buy Now button HTML
          if (isMoreDetails) {
            const buyNowButtonHtml = `<div><a href="${amazonUrl}" target="_blank"><button class="buy-now-button">Buy now</button></a></div>`;
            pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookTitleMatch[0] + buyNowButtonHtml);
          } else {
            const buyNowButtonHtml = `<div><a href="${amazonUrl}" target="_blank"><button class="buy-now-button">Buy now</button></a></div>`;
            const moreDetailsButtonHtml = `<div><button type="button" class="more-details-btn" data-book-title="${bookTitle}" data-author="${author}">More Details</button></div>`;
            pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookTitleMatch[0] + buyNowButtonHtml + moreDetailsButtonHtml);
          }
          buttonCounter++;

          // If the cover image URL is not the default, concatenate div tag with the image tag
          if (coverImageUrl !== 'default-cover.jpg') {
            const imageDiv = `<div><img src="${coverImageUrl}" alt=""></div>`;
            pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookTitleMatch[0] + imageDiv);
          }

          let replaceCount = 0; // To keep track of the number of replacements

          pausedEmit = pausedEmit.replace(/\*/g, () => {
              replaceCount++;
              return replaceCount === 1 ? "<h3>" : "</h3>";
          });
                    
          // Emit pausedEmit and reset
          completeResponse += pausedEmit;
          if(!isMoreDetails) {
            // Update the current message with the new chunk.
            session.messages[messageIndex].content += pausedEmit;
            await session.save();
          }
          
          socket.emit('chunk', { content: pausedEmit, sessionId, isMoreDetails });
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
        
        if(!isMoreDetails) {
          // Update the current message with the new chunk.
          session.messages[messageIndex].content += chunkContent;
          await session.save();
        }
        socket.emit('chunk', { content: chunkContent, sessionId, isMoreDetails });
      }
      const finishReason = chunk.choices[0]?.finish_reason;
      if (finishReason === 'stop') {
        const MoreDetails = require('./models/MoreDetails');
        const newDetail = new MoreDetails({
            bookTitle,
            author,
            detailedDescription: completeResponse // Save complete response here
        });
        await newDetail.save();

        socket.emit('streamEnd', { message: 'Stream completed', sessionId }); // Emit a message indicating stream end
        break; // Optionally break out of the loop if the stream is finished
      }
    }

  } catch (error) {
    console.error('openaiApi - Error calling OpenAI API:', error);
    throw error;
  }
};

openaiApi.getSummary = async (text) => {
  try {
    const prompt = `Summarize the following text in 4 words:\n\n"${text}"\n\nSummary:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 10, // Adjust as needed to ensure brevity
    });

    let summary = response.choices[0]?.message?.content.trim() || "New Chat";
    // Remove any full stops from the summary
    summary = summary.replace(/\./g, '');
    
    return summary;
  } catch (error) {
    console.error('Error getting summary:', error);
    return "Brief Summary";
  }
};

openaiApi.getSummaryWithGPT3_5Turbo = async (text) => {
  try {
    const prompt = `Summarize the following text in 4 words:\n\n"${text}"\n\nSummary:`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 10, // Adjust as needed to ensure brevity
    });

    let summary = response.choices[0]?.message?.content.trim() || "New Chat";
    // Remove any full stops from the summary
    summary = summary.replace(/\./g, '');
    
    return summary;
  } catch (error) {
    console.error('Error getting summary:', error);
    return "Brief Summary";
  }
};

openaiApi.stopStream = () => {
  isStreamingActive = false; // Set the flag to false to stop the stream
};

module.exports = openaiApi;