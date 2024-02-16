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

// Function to generate a "Buy Now" button for a book
function createBuyNowButton(bookTitle, author = '') {
  let amazonUrl = `https://www.amazon.com/s?k=${encodeForUrl(bookTitle)}`;
  if (author) {
    amazonUrl += `+by+${encodeForUrl(author)}`;
  }
  return `<div><a href="${amazonUrl}" target="_blank"><button class="buy-now-button">Buy Now</button></a></div>`;
}


// Assuming `isEmbeddable` is a boolean that determines if the book can be previewed
function createPreviewButtonHtml(bookTitle, author, isEmbeddable) {
  const disabledStyles = `style="cursor: not-allowed; opacity: 0.5; pointer-events: none;"`;
  const buttonStyles = isEmbeddable ? "" : disabledStyles;

  return `<div><button type="button" class="preview-btn" data-book-title="${bookTitle}" data-author="${author}" ${buttonStyles}>Preview</button></div>`;
};

function createBookInfoHtml(bookTitle, author) {
  let bookInfoHtml = `<div class="book-info">
      <h3 class="book-title">${bookTitle}</h3>`;
  // If author exists, add author information
  if (author) {
    bookInfoHtml += `<span class="book-author">by ${author}</span>`;
  }
  // Close the book-info div
  bookInfoHtml += `</div>`;
  return bookInfoHtml;
}

const getBookCover = async (bookTitleWithAuthor) => {
  try {
    const { bookTitle, author } = parseBookTitle(bookTitleWithAuthor);

    const existingBook = await Book.findOne({ title: bookTitle });
    if (existingBook) {
      existingBook.coverImageUrl = existingBook.coverImageUrl.replace("&edge=curl", "");
      // Assume you also want to return the embeddable status if the book already exists
      return { coverImageUrl: existingBook.coverImageUrl, embeddable: existingBook.embeddable };
    }

    let query = `intitle:${encodeURIComponent(bookTitle)}`;
    if (author) {
      query += `+inauthor:${encodeURIComponent(author)}`;
    }
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${query}&key=${process.env.REACT_APP_GOOGLE_BOOKS_API_KEY}`);

    let coverImageUrl = '';
    let isbn = '';
    let embeddable = false; // Initialize embeddable as false

    // Check if items exist and are not empty
    if (response.data.items && response.data.items.length > 0) {
      // Find the first embeddable item, or default to the first item if none are embeddable
      let book = response.data.items.find(item => item.accessInfo.embeddable === true);
      if (book) {
        embeddable = true; // Update embeddable status based on the response
      } else {
        book = response.data.items[0]; // Default to the first item if none are embeddable
      }
      const volumeInfo = book.volumeInfo;

      // Try to extract ISBN if available
      const foundIsbn = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier;
      if (foundIsbn) isbn = foundIsbn;

      // Try to extract cover image URL if available
      if (volumeInfo.imageLinks && volumeInfo.imageLinks.thumbnail) {
        coverImageUrl = volumeInfo.imageLinks.thumbnail.replace("&edge=curl", "");
      }
    }

    // Include embeddable status while creating a new book
    const newBook = new Book({ title: bookTitle, coverImageUrl, isbn, embeddable }); 
    await newBook.save();

    // Return both the cover image URL and embeddable status
    return { coverImageUrl, embeddable };

  } catch (error) {
    console.error(`Error fetching book cover for ${bookTitleWithAuthor}:`, error);
    // Adjusted to return both coverImageUrl as empty and embeddable as false in case of error
    return { coverImageUrl: '', embeddable: false };
  }
};

const openai = new OpenAI(process.env.OPENAI_API_KEY);

let isStreamingActive = false;

const fetchMoreDetails = async (bookTitle, author) => {
  try {
    const response = await axios.get(`http://localhost:3000/api/more-details`, {
      params: { bookTitle, author }
    });
    return response; // Return the response for further handling
  } catch (error) {
    throw error; // Throw the error to be caught in the calling function
  }
};  

const openaiApi = async (messages, socket, session, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, bookTitle, author, moreBooks) => {

  if (!isMoreDetails && messages[messages.length - 1].content.startsWith("Explain the book - ")) {
    try {
      const response = await fetchMoreDetails(bookTitle, author);
      if (response && response.data && response.data.detailedDescription) {
        const detailedDescription = response.data.detailedDescription;

        messageIndex = session.messages.push({
          role: 'assistant',
          contentType: 'simple',
          content: detailedDescription
        }) - 1;
        await session.save();

        socket.emit('chunk', { content: detailedDescription, sessionId, isMoreDetails, moreBooks });
        socket.emit('streamEnd', { message: 'Stream completed', sessionId });
        return; // End the function here if details are successfully fetched
      }
    } catch (error) {
      console.log("Error fetching book details inside openaiApi code");
    }
  }

  isStreamingActive = true;

  const filteredMessages = messages.map(({ role, content }) => ({ role, content }));
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: filteredMessages,
      max_tokens: 4096,
      stream: true,
    });    

    let messageIndex;
    if (!isMoreDetails && !isKeyInsights && !isAnecdotes) {
      if (moreBooks) {
        // Update the last message in the session instead of creating a new one
        messageIndex = session.messages.length - 1;
      } else {
        // Create a new message entry for this stream.
        messageIndex = session.messages.push({
          role: 'assistant',
          contentType: 'simple',
          content: ''
        }) - 1;
      }
      await session.save();
    }

    let completeResponse = "";
    let pausedEmit = ""; // Variable to hold paused chunks
    let isPaused = false; // Flag to check if emitting is paused

    if (isKeyInsights || isAnecdotes || isMoreDetails) {
      const bookInfoHtml = createBookInfoHtml(bookTitle, author);
      const bookCoverResult = await getBookCover(originalBookTitle);
      coverImageUrl = bookCoverResult.coverImageUrl;
      let imageDiv = ``;
      if (coverImageUrl) {
        imageDiv = `<div><img src="${coverImageUrl}" alt=""></div>`;
      }
      const buyNowButtonHtml = createBuyNowButton(bookTitle, author);
      completeResponse = bookInfoHtml + imageDiv + buyNowButtonHtml;
      socket.emit('chunk', { content: completeResponse, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, moreBooks });
    }

    for await (const chunk of stream) {
      if (!isStreamingActive) break; 
      let chunkContent = chunk.choices[0]?.delta?.content || "";
      // console.log(chunkContent);

      if (chunkContent.includes('#')) {
        if (isPaused) {
          // If resuming, add current chunk to pausedEmit
          pausedEmit += chunkContent;

          // Extract book title enclosed in '#'
          let bookTitleMatch = pausedEmit.match(/#(.*?)#/);
          const bookTitleWithAuthor = bookTitleMatch ? bookTitleMatch[1] : "";

          const { coverImageUrl, embeddable } = await getBookCover(bookTitleWithAuthor);

          // Parse bookTitle and author from the content
          let parsed = parseBookTitle(bookTitleWithAuthor); // Example function call
          bookTitle = parsed.bookTitle;
          author = parsed.author;

          const buyNowButtonHtml = createBuyNowButton(bookTitle, author);

          if (isMoreDetails || messages[messages.length - 1].content.startsWith("Explain the book - ")) {
            pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookTitleMatch[0] + buyNowButtonHtml);
          } else {
            const moreDetailsButtonHtml = `<div><button type="button" class="more-details-btn" data-book-title="${bookTitle}" data-author="${author}">Book Info</button></div>`;
            const keyInsightsButtonHtml = `<div><button type="button" class="key-insights-btn" data-book-title="${bookTitle}" data-author="${author}">Key Insights</button></div>`;
            const anecdotesButtonHtml = `<div><button type="button" class="anecdotes-btn" data-book-title="${bookTitle}" data-author="${author}">Anecdotes</button></div>`;
            const previewButtonHtml = createPreviewButtonHtml(bookTitle, author, embeddable);
            pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookTitleMatch[0] + buyNowButtonHtml + moreDetailsButtonHtml + keyInsightsButtonHtml + anecdotesButtonHtml + previewButtonHtml);
          }

          if (coverImageUrl) {
            const imageDiv = `<div><img src="${coverImageUrl}" alt=""></div>`;
            pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookTitleMatch[0] + imageDiv);
          }

          const bookInfoHtml = createBookInfoHtml(bookTitle, author);
          pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookInfoHtml);
          pausedEmit = pausedEmit.replace(/\#/g, '');
                    
          // Emit pausedEmit and reset
          completeResponse += pausedEmit;
          if (moreBooks || (!isMoreDetails && !isKeyInsights && !isAnecdotes) ) {
            // Update the current message with the new chunk.
            session.messages[messageIndex].content += pausedEmit;
            await session.save();
          }
          
          socket.emit('chunk', { content: pausedEmit, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, moreBooks });
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
        
        if (moreBooks || (!isMoreDetails && !isKeyInsights && !isAnecdotes) ) {

          // Update the current message with the new chunk.
          session.messages[messageIndex].content += chunkContent;
          await session.save();
        }
        socket.emit('chunk', { content: chunkContent, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, moreBooks });
      }
      const finishReason = chunk.choices[0]?.finish_reason;
      if (finishReason === 'stop') {
        if (isMoreDetails || messages[messages.length - 1].content.startsWith("Explain the book - ")) {
          const MoreDetails = require('./models/MoreDetails');
          // if (checkFormat(completeResponse)) {
              const newDetail = new MoreDetails({
                  bookTitle,
                  author,
                  detailedDescription: completeResponse // Save complete response here
              });
              await newDetail.save();
          // }
        }
        else if (isKeyInsights) {
          const KeyInsights = require('./models/KeyInsights');
            const newDetail = new KeyInsights({
                bookTitle,
                author,
                keyInsights: completeResponse // Save complete response here
            });
            await newDetail.save();
        } else if (isAnecdotes) {
          const Anecdotes = require('./models/Anecdotes');
            const newDetail = new Anecdotes({
                bookTitle,
                author,
                anecdotes: completeResponse // Save complete response here
            });
            await newDetail.save();
        }
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
    const prompt = `Summarize following text:\n"${text}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 4, // Adjust as needed to ensure brevity
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

// openaiApi.getNewsletter = async (prompt) => {
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4-1106-preview",
//       messages: [{ role: 'system', content: prompt }],
//     });

//     let newsletterContent = response.choices[0]?.message?.content.trim();
//     console.log("newsletterContent: ", newsletterContent);

//     const bookListMatches = [...newsletterContent.matchAll(/#([\s\S]*?)#/g)];

//     for (const match of bookListMatches) {
//       const bookTitleWithAuthor = match[1];
//       console.log("bookTitleWithAuthor: ", bookTitleWithAuthor);
      
//       // Enclose book title and author in <b> tags
//       const bookTitleWithAuthorBold = `<b>${bookTitleWithAuthor}</b>`;

//       // Fetch book cover image
//       const coverImageUrl = await getBookCover(bookTitleWithAuthor);
      
//       // Extract book title and author
//       let { bookTitle, author } = parseBookTitle(bookTitleWithAuthor);

//       const encodedTitle = encodeForUrl(bookTitle);
//       let amazonUrl = `https://www.amazon.in/s?k=${encodedTitle}`;
//       let detailsUrl = `http://localhost:3001/?bookTitle=${encodedTitle}`;

//       if (author) {
//         const encodedAuthor = `+by+${encodeForUrl(author)}`;
//         amazonUrl += encodedAuthor;

//         const encodedAuthorMoreDetials = `&author=${encodeForUrl(author)}`;
//         detailsUrl += encodedAuthorMoreDetials;
//       }

//       const buyNowButtonHtml = `<div><a href="${amazonUrl}" style="cursor: pointer; text-decoration: none;" target="_blank"><button style="background: none; border: 1px solid black; font-family: Arial, sans-serif; font-size: 1rem; padding: 0.25rem 0.6rem; border-radius: 0.7rem; cursor: pointer; text-align: center; display: inline-block; margin-bottom: 0.7rem; margin-top: 0.7rem; width: 8.3rem;">Buy now</button></a></div>`;
//       const moreDetailsButtonHtml = `<div><a href="${detailsUrl}" style="text-decoration: none;" target="_blank"><button type="button" style="background: none; border: 1px solid black; font-family: Arial, sans-serif; font-size: 1rem; padding: 0.25rem 0.6rem; border-radius: 0.7rem; cursor: pointer; text-align: center; display: inline-block; margin-bottom: 0.2rem; width: 8.3rem;">More Details</button></a></div>`;

//       newsletterContent = newsletterContent.replace(match[0], bookTitleWithAuthorBold + buyNowButtonHtml + moreDetailsButtonHtml);

//       // If the cover image URL is not the default, concatenate div tag with the image tag
//       if (coverImageUrl !== 'default-cover.jpg') {
//         const imageDiv = `<div style="margin-top: 0.8rem; margin-bottom: -0.1rem;"><img src="${coverImageUrl}" alt=""></div>`;
//         newsletterContent = newsletterContent.replace(bookTitleWithAuthorBold, bookTitleWithAuthorBold + imageDiv);
//       }
//     }

//     newsletterContent = newsletterContent.replace(/\#/g, '');
//     return newsletterContent;
//   } catch (error) {
//     console.log('Error getting newsletter content', error);
//     return "Error getting newsletter content";
//   }
// };

