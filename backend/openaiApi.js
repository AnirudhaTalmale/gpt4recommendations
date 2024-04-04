// openaiApi.js
const { OpenAI } = require('openai');
require('dotenv').config();
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const axios = require('axios');
const BookData = require('./models/models-chat/BookData'); 
const redisClient = require('./redisClient');
const { 
  checkFormatMoreDetails, 
  checkFormatKeyInsights, 
  checkFormatAnecdotes, 
  checkFormatQuotes 
} = require('./checkFormatFunctions');

const parseBookTitle = (bookTitleWithAuthor) => {
  // Remove any occurrences of opening or closing quotes
  const cleanedTitle = bookTitleWithAuthor.replace(/"/g, '');

  // Split the cleaned title into book title and author
  const splitTitle = cleanedTitle.split(' by ');
  const bookTitle = splitTitle[0];
  const author = splitTitle.length > 1 ? splitTitle[1] : null;

  return { bookTitle, author };
};

function createPreviewButtonHtml(previewLink) {
  const disabledStyles = `style="cursor: not-allowed; opacity: 0.5; pointer-events: none;"`;
  const isEnabled = previewLink !== '';
  const buttonStyles = isEnabled ? "" : disabledStyles;
  const dataAttribute = isEnabled ? `data-preview-link="${previewLink}"` : "";

  return `<div><button type="button" class="preview-btn" ${buttonStyles} ${dataAttribute}>Preview</button></div>`;
}

function createBookInfoHtml(bookTitle, author, amazonStarRating, amazonReviewCount) {

  let bookInfoHtml = `<div class="book-info">
      <strong class="book-title">${bookTitle}</strong>`;

  // If author exists, add author information
  if (author) {
    bookInfoHtml += `<div class="book-author">by ${author}</div>`;
  }

  // Start the ratings and review container
  if (amazonStarRating !== 'Unknown' || amazonReviewCount !== 'Unknown') {
    bookInfoHtml += `<div class="ratings-and-review">`;

    // Add star rating
    if (amazonStarRating && amazonStarRating !== 'Unknown') {
      bookInfoHtml += `<div class="star-rating">`;

      // Add full stars
      for (let i = 0; i < Math.floor(amazonStarRating); i++) {
        bookInfoHtml += `<i class="fa-solid fa-star"></i>`;
      }

      // Check for half star
      if (amazonStarRating % 1 !== 0) {
        bookInfoHtml += `<i class="fa-solid fa-star-half-stroke"></i>`;
      }

      bookInfoHtml += `</div>`; // Close star-rating div
    }

    // If review count exists, add review count information
    if (amazonReviewCount && amazonReviewCount !== 'Unknown') {
      bookInfoHtml += `<span class="review-count">${amazonReviewCount}</span>`;
    }

    bookInfoHtml += `</div>`; // Close ratings-and-review div
  }

  // Close the book-info div
  bookInfoHtml += `</div>`;

  return bookInfoHtml;
}

// Helper function to calculate the length of the longest common substring
function getLongestCommonSubstringLength(s1, s2) {
  const dp = Array.from({ length: s1.length + 1 }, () => Array(s2.length + 1).fill(0));
  let maxLength = 0;
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        maxLength = Math.max(maxLength, dp[i][j]);
      }
    }
  }
  return maxLength;
}

async function getAmazonBookData(title, author) {
  try {
    const titleBeforeColon = title.split(':')[0].trim();
    const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
      params: {
        key: process.env.REACT_APP_GOOGLE_CUSTOM_SEARCH_API_KEY,
        cx: process.env.GOOGLE_CSE_ID,
        q: `site:amazon.in ${titleBeforeColon} by ${author}`,
        num: 1
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      const item = response.data.items[0];

      // Check if the result's domain ends with 'amazon.in'
      if (!item.displayLink.endsWith('amazon.in')) {
        console.log('Result is not from a valid Amazon India domain');
        return { amazonLink: '', amazonStarRating: '', amazonReviewCount: '', amazonImage: '' };
      }

      // Validate the title
      const itemTitleLower = item.title.toLowerCase();
      const searchTitleLower = title.toLowerCase();

      const longestCommonSubstringLength = getLongestCommonSubstringLength(itemTitleLower, searchTitleLower);
      const matchPercentage = longestCommonSubstringLength / searchTitleLower.length;

      if (matchPercentage < 0.5) {
        console.log('Title does not match the search');
        console.log(itemTitleLower);
        console.log(searchTitleLower);
        return { amazonLink: '', amazonStarRating: '', amazonReviewCount: '', amazonImage: '' };
      }

      
      const ogImage = item.pagemap.metatags[0]['og:image'];
      const decodedOgImage = decodeURIComponent(ogImage);

      const starRatingMatch = decodedOgImage.match(/_PIStarRating(.*?),/);
      const amazonStarRating = starRatingMatch ? convertStarRating(starRatingMatch[1]) : 'Unknown';
      
      const reviewCountMatch = decodedOgImage.match(/_ZA(\d+(%2C\d+)?)/);
      const amazonReviewCount = reviewCountMatch ? reviewCountMatch[1].replace('%2C', ',') : 'Unknown';

      let amazonLink = item.pagemap.metatags[0]['og:url'];

      const imageIdMatch = ogImage.match(/(https:\/\/m\.media-amazon\.com\/images\/I\/[^.]+)/);
      let amazonImage = imageIdMatch ? `${imageIdMatch[1]}._AC_UF1000,1000_QL80_.jpg` : '';

      let url = new URL(amazonLink);
      url.hostname = 'www.amazon.in'; 
      amazonLink = url.href.split('/ref')[0];

      return { amazonLink, amazonStarRating, amazonReviewCount, amazonImage };
    } else {
      console.log('No results found.');
      return { amazonLink: '', amazonStarRating: '', amazonReviewCount: '', amazonImage: '' };
    }
  } catch (error) {
    console.error('Error during API request:', error);
    return { amazonLink: '', amazonStarRating: '', amazonReviewCount: '', amazonImage: '' };
  }
}

function convertStarRating(starString) {
  const starRatingMap = {
    'ONE': '1.0',
    'ONEANDHALF': '1.5',
    'TWO': '2.0',
    'TWOANDHALF': '2.5',
    'THREE': '3.0',
    'THREEANDHALF': '3.5',
    'FOUR': '4.0',
    'FOURANDHALF': '4.5',
    'FIVE': '5.0'
  };
  
  return starRatingMap[starString] || starString;
}

const getGoogleBookData = async (title) => {
  try {
    
    let query = `intitle:${encodeURIComponent(title)}`;
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${query}&key=${process.env.REACT_APP_GOOGLE_BOOKS_API_KEY}`);

    let googleImage = '';
    let isbn = '';
    let previewLink = '';

    if (response.data.items?.length) {
      // console.log("response.data.items is: ", response.data.items);
      const filteredBooks = response.data.items.filter(item => {
        const itemTitleNormalized = item.volumeInfo.title.toLowerCase().replace(/&/g, 'and');
        const searchTitleNormalized = title.toLowerCase().replace(/&/g, 'and');
        
        return (itemTitleNormalized.includes(searchTitleNormalized) || searchTitleNormalized.includes(itemTitleNormalized))
            && item.volumeInfo.language === 'en';
    });
    
      
      const bookWithPreview = filteredBooks.find(item => 
        item.accessInfo.viewability !== 'NO_PAGES' &&
        item.accessInfo.viewability !== 'UNKNOWN' &&
        item.accessInfo.accessViewStatus !== 'NONE' &&
        item.volumeInfo.previewLink 
      );
    
      const book = bookWithPreview || filteredBooks[0];
    
      if (book) {
        const { volumeInfo } = book;
        previewLink = volumeInfo.previewLink || '';
        const foundIsbn = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier;
        if (foundIsbn) {
          isbn = foundIsbn;
        }

        // To get the largest available image
        const imageLinks = volumeInfo.imageLinks;
        if (imageLinks) {
          const imageSizeKeys = ['extraLarge', 'large', 'medium', 'small', 'thumbnail', 'smallThumbnail'];
          for (const sizeKey of imageSizeKeys) {
            if (imageLinks[sizeKey]) {
              googleImage = imageLinks[sizeKey].replace("&edge=curl", "");
              break; // Stop once the largest available image is found
            }
          }
        }
      }
    }
    return { googleImage, isbn, previewLink};

  } catch (error) {
    console.error(`Error fetching book cover for ${title}:`, error);
    return { googleImage: '', isbn: '', previewLink: '' };
  }
};

const getBookData = async (title, author, isbn = '') => {
  try {
    let cacheKey = `book-data:${isbn || title}`;

    // Check if the data is available in Redis cache
    let cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Fetch from database
    let query = isbn ? { isbn } : { title };
    let existingBook = await BookData.findOne(query);

    if (existingBook) {
      let bookDetails = {
        isbn: existingBook.isbn,
        title: existingBook.title,
        author: existingBook.author,
        bookImage: existingBook.bookImage,
        previewLink: existingBook.previewLink,
        amazonLink: existingBook.amazonLink,
        amazonStarRating: existingBook.amazonStarRating,
        amazonReviewCount: existingBook.amazonReviewCount
      };

      await redisClient.set(cacheKey, JSON.stringify(bookDetails));

      return bookDetails;
    }
    
    const amazonData = await getAmazonBookData(title, author);
    const googleData = await getGoogleBookData(title);

    const amazonLink = amazonData.amazonLink || `https://www.amazon.in/s?k=${encodeURIComponent(`${title.trim()} by ${author.trim()}`)}`;

    // Merge data
    const bookData = {
      isbn: googleData.isbn,
      title: title,
      author: author,
      bookImage: amazonData.amazonImage || googleData.googleImage,
      previewLink: googleData.previewLink,
      amazonLink: amazonLink,
      amazonStarRating: amazonData.amazonStarRating,
      amazonReviewCount: amazonData.amazonReviewCount,
    };

    // Save merged data
    const newBookData = new BookData(bookData);
    await newBookData.save();

    return bookData;
  } catch (error) {
    console.error('Error during book data aggregation:', error);
    return { isbn: '', title: '', author: '', bookImage: '', previewLink: '', amazonLink: '', amazonStarRating: 'Unknown', amazonReviewCount: 'Unknown' };
  }
};

function createBuyNowButtonHtml(link, buttonText = 'Buy Now') {
  return `<div><a href="${link}" target="_blank"><button class="buy-now-button">${buttonText}</button></a></div>`;
}

let isStreamingActive = false;

const openaiApi = async (messages, socket, session, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, isbn, bookTitle, author, moreBooks) => {

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
    if (!isMoreDetails && !isKeyInsights && !isAnecdotes && !isQuotes) {
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

    if (isKeyInsights || isAnecdotes || isQuotes || isMoreDetails) {
      const { bookImage, amazonLink, amazonStarRating, amazonReviewCount } = await getBookData(bookTitle, author, isbn);
      const bookInfoHtml = createBookInfoHtml(bookTitle, author, amazonStarRating, amazonReviewCount);
      let imageDiv = '';
      if (bookImage) {
        imageDiv = `<div><img src="${bookImage}" alt=""></div>`;
      }
      const buyNowButtonHtml = createBuyNowButtonHtml(amazonLink);
      completeResponse = bookInfoHtml + imageDiv + buyNowButtonHtml;
      socket.emit('chunk', { content: completeResponse, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, moreBooks });
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
          let bookTitleMatch = pausedEmit.match(/#(?:\d+\.\s)?(.*?)#/);
          const bookTitleWithAuthor = bookTitleMatch ? bookTitleMatch[1] : "";
          const { bookTitle, author } = parseBookTitle(bookTitleWithAuthor);
          const { isbn, bookImage, previewLink, amazonLink, amazonStarRating, amazonReviewCount } = await getBookData(bookTitle, author);
          const buyNowButtonHtml = createBuyNowButtonHtml(amazonLink);

          let imageSource = bookImage;
          let imageDiv = '';
          if (imageSource) {
            imageDiv = `<div class="image-container"><img src="${imageSource}" alt=""></div>`;
          }

          if (isMoreDetails || messages[messages.length - 1].content.startsWith("Explain the book - ")) {
            pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookTitleMatch[0] + buyNowButtonHtml);
          } else {
            const moreDetailsButtonHtml = `<div><button type="button" class="more-details-btn" data-isbn="${isbn}" data-book-title="${bookTitle}" data-author="${author}">Book Info</button></div>`;
            const keyInsightsButtonHtml = `<div><button type="button" class="key-insights-btn" data-isbn="${isbn}" data-book-title="${bookTitle}" data-author="${author}">Insights</button></div>`;
            const anecdotesButtonHtml = `<div><button type="button" class="anecdotes-btn" data-isbn="${isbn}" data-book-title="${bookTitle}" data-author="${author}">Anecdotes</button></div>`;
            const quotesButtonHtml = `<div><button type="button" class="quotes-btn" data-isbn="${isbn}" data-book-title="${bookTitle}" data-author="${author}">Quotes</button></div>`;
            const previewButtonHtml = createPreviewButtonHtml(previewLink);

            const buttonsHtml = buyNowButtonHtml + moreDetailsButtonHtml + keyInsightsButtonHtml + anecdotesButtonHtml + quotesButtonHtml + previewButtonHtml;
            const buttonsDiv = `<div class="buttons-container">${buttonsHtml}</div>`;

            const contentDiv = `<div class="content-container">${imageDiv}${buttonsDiv}</div>`;

            pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookTitleMatch[0] + contentDiv);
          }

          const bookInfoHtml = createBookInfoHtml(bookTitle, author, amazonStarRating, amazonReviewCount);
          pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookInfoHtml);
          pausedEmit = pausedEmit.replace(/#/g, '');
                    
          // Emit pausedEmit and reset
          completeResponse += pausedEmit;
          if (moreBooks || (!isMoreDetails && !isKeyInsights && !isAnecdotes) ) {
            // Update the current message with the new chunk.
            session.messages[messageIndex].content += pausedEmit;
            await session.save();
          }
          
          socket.emit('chunk', { content: pausedEmit, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, moreBooks });
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
        
        if (moreBooks || (!isMoreDetails && !isKeyInsights && !isAnecdotes && !isQuotes) ) {

          // Update the current message with the new chunk.
          session.messages[messageIndex].content += chunkContent;
          await session.save();
        }
        socket.emit('chunk', { content: chunkContent, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, moreBooks });
      }
      const finishReason = chunk.choices[0]?.finish_reason;
      if (finishReason === 'stop') {
        if (isMoreDetails || messages[messages.length - 1].content.startsWith("Explain the book - ")) {
          const MoreDetails = require('./models/models-chat/MoreDetails');
          const newDetail = new MoreDetails({
            isbn,
            bookTitle,
            detailedDescription: completeResponse // Save complete response here
          });
          if ( checkFormatMoreDetails(completeResponse) ) {
            await newDetail.save();
          }
        }
        else if (isKeyInsights) {
          const KeyInsights = require('./models/models-chat/KeyInsights');
          const newDetail = new KeyInsights({
            isbn,
            bookTitle,
            keyInsights: completeResponse // Save complete response here
          });
          if ( checkFormatKeyInsights(completeResponse) ) {
            await newDetail.save();
          }
        } else if (isAnecdotes) {
          const Anecdotes = require('./models/models-chat/Anecdotes');
          const newDetail = new Anecdotes({
            isbn,
            bookTitle,
            anecdotes: completeResponse // Save complete response here
          });
          if ( checkFormatAnecdotes(completeResponse) ) {
            await newDetail.save();
          }
        } else if (isQuotes) {
          const Quotes = require('./models/models-chat/Quotes');
          const newDetail = new Quotes({
            isbn,
            bookTitle,
            quotes: completeResponse // Save complete response here
          });
          if ( checkFormatQuotes(completeResponse) ) {
            await newDetail.save();
          }
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

openaiApi.stopStream = () => {
  isStreamingActive = false; // Set the flag to false to stop the stream
};

module.exports = openaiApi;




