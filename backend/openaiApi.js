// openaiApi.js
const { OpenAI } = require('openai');
require('dotenv').config();
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const axios = require('axios');
const BookData = require('./models/models-chat/BookData'); 
const BookDataErrorLog = require('./models/models-chat/BookDataErrorLog');
const redisClient = require('./redisClient');
const mongoose = require('mongoose');
const { Types } = mongoose;
const ObjectId = Types.ObjectId;
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

function renderStarRatingHtml(rating) {
  let starsHtml = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const maxStars = 5;

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += `<i class="fa-solid fa-star"></i>`;
  }

  // Add half star if necessary
  if (hasHalfStar) {
    starsHtml += `<i class="fa-solid fa-star-half-stroke"></i>`;
  }

  // Calculate remaining stars needed to make total of 5
  const totalStars = hasHalfStar ? fullStars + 1 : fullStars;
  for (let i = totalStars; i < maxStars; i++) {
    starsHtml += `<i class="fa-regular fa-star"></i>`;
  }

  return `<div class="star-rating">${starsHtml}</div>`;
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
      bookInfoHtml += renderStarRatingHtml(amazonStarRating);
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

const normalizeTitle = (title) => {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[‘’]/g, "'") // Replace curly single quotes with straight single quotes
    .replace(/[“”]/g, '"') // Replace curly double quotes with straight double quotes
    .replace(/–/g, '-') // Replace en dashes with hyphens
    .replace(/—/g, '-') // Replace em dashes with hyphens
    .replace(/,/g, '') // Remove commas
    .replace(/-/g, ' ') // Replace all hyphens with spaces
    .replace(/\b(the|a|an)\b/g, '') // Remove articles
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .replace(/s\b/g, '') // Remove trailing 's' for plurals
    .replace(/o\b/g, 'on') // Normalize ending 'o' to 'on'
    .replace(/aa/g, 'a') // Normalize double 'a' to single 'a'
    .replace(/ee/g, 'e') // Normalize double 'e' to single 'e'
    .replace(/ii/g, 'i') // Normalize double 'i' to single 'i'
    .replace(/oo/g, 'u') // Normalize double 'o' to single 'u'
    .replace(/uu/g, 'u') // Normalize double 'u' to single 'u'
    .trim(); // Trim whitespace from the start and end of the string
};

function getTitleBeforeDelimiter(title) {
  // Find the index of each delimiter in the title. If a delimiter is not found, -1 is returned.
  const colonIndex = title.indexOf(':');
  const questionMarkIndex = title.indexOf('?');
  const dotIndex = title.indexOf('.');

  // Filter out any -1 values, as they indicate the delimiter was not found in the title,
  // and then find the minimum index which is the leftmost delimiter.
  const delimiterIndexes = [colonIndex, questionMarkIndex, dotIndex].filter(index => index !== -1);
  const minIndex = delimiterIndexes.length > 0 ? Math.min(...delimiterIndexes) : -1;

  // If a delimiter is found (minIndex is not -1), split the title at that delimiter.
  // Otherwise, use the whole title.
  return minIndex !== -1 ? title.substring(0, minIndex).trim() : title;
}

function getAuthorBeforeAnd(author) {
  // Check if the author is a non-empty string
  if (typeof author === 'string' && author.trim() !== '') {
      // Normalize the delimiters used for separating multiple authors to commas
      const normalizedAuthor = author.replace(/ & /g, ', ').replace(/ and /g, ', ');
      // Split the string at commas and return the first author
      return normalizedAuthor.split(', ')[0];
  } else {
      // Log or handle the error appropriately if input is invalid
      console.error('Invalid or missing author');
      return '';
  }
}

const getTextBeforeFirstColon = (title) => {
  return title.split(':')[0].trim();
};

const getTextBetweenFirstAndSecondColon = (title) => {
  const parts = title.split(':');
  if (parts.length > 1) {
      return parts[1].trim();
  }
  return '';
};

async function getAmazonBookData(title, author, country, fallback = true) {
  try {
    const titleBeforeDelimiter = getTitleBeforeDelimiter(title)
    const authorBeforeAnd = getAuthorBeforeAnd(author);
    const amazonDomain = country === 'India' ? 'amazon.in' : 'amazon.com';

    const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
      params: {
        key: process.env.REACT_APP_GOOGLE_CUSTOM_SEARCH_API_KEY,
        cx: process.env.GOOGLE_CSE_ID,
        q: `site:${amazonDomain} ${title} by ${authorBeforeAnd}`,
        num: 1  // Fetch two results instead of one
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      for (let i = 0; i < Math.min(1, response.data.items.length); i++) {
        const item = response.data.items[i];

        if (!item.displayLink.endsWith(amazonDomain)) {
          console.log(`Result is not from a valid Amazon ${country} domain`);
          continue;  // Skip to the next item
        }

        const firstPart = getTextBeforeFirstColon(item.title);
        const secondPart = getTextBetweenFirstAndSecondColon(item.title);

        const firstPartNormalized = normalizeTitle(firstPart);
        const secondPartNormalized = normalizeTitle(secondPart);
        const searchTitleNormalized = normalizeTitle(titleBeforeDelimiter);

        // Check each part against the normalized search title
        if (firstPartNormalized.includes(searchTitleNormalized) || searchTitleNormalized.includes(firstPartNormalized) || 
            secondPartNormalized.includes(searchTitleNormalized) || searchTitleNormalized.includes(secondPartNormalized)) {

          // If title matches, process further
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

          if (!fallback && country === 'US') {
            url.hostname = 'www.amazon.in'; // Change to amazon.in
          } else {
            url.hostname = `www.${amazonDomain}`; // Use the original domain
          }

          amazonLink = url.href.split('/ref')[0];

          return { amazonLink, amazonStarRating, amazonReviewCount, amazonImage };
        } else {
          console.log(country);
          console.log('Title does not match the search');
          console.log(firstPartNormalized);
          console.log(secondPartNormalized);
          console.log(searchTitleNormalized);
        }
      }
    }

    // Fallback to amazon.com
    if (country === 'India' && fallback) {
      return await getAmazonBookData(title, author, 'US', false);
    }

    console.log('No suitable results found.');
    return { amazonLink: '', amazonStarRating: '', amazonReviewCount: '', amazonImage: '' };
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

const getGoogleBookData = async (title, author) => {
  try {
    const authorBeforeAnd = getAuthorBeforeAnd(author);
    const query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(authorBeforeAnd)}`;
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${query}&key=${process.env.REACT_APP_GOOGLE_BOOKS_API_KEY}`);

    let googleImage = '';
    let previewLink = '';

    const titleBeforeDelimiter = getTitleBeforeDelimiter(title);
    const searchTitleNormalized = normalizeTitle(titleBeforeDelimiter);

    if (response.data.items?.length) {
      // console.log("response.data.items is: ", response.data.items);

      const filteredBooks = response.data.items.filter(item => {
        const itemTitleNormalized = normalizeTitle(item.volumeInfo.title);
        return (itemTitleNormalized.includes(searchTitleNormalized) || searchTitleNormalized.includes(itemTitleNormalized))
            && item.volumeInfo.language === 'en';
    });
    
      // const bookWithPreview = filteredBooks.find(item => 
      //   item.accessInfo.viewability !== 'NO_PAGES' &&
      //   item.accessInfo.viewability !== 'UNKNOWN' &&
      //   item.accessInfo.accessViewStatus !== 'NONE' &&
      //   item.volumeInfo.previewLink 
      // );
    
      const book =  filteredBooks[0];
    
      if (book) {
        const { volumeInfo, id } = book;
        previewLink = `https://books.google.co.in/books?id=${id}&printsec=frontcover&gbpv=1`;

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
    return { googleImage, previewLink};

  } catch (error) {
    console.error(`Error fetching book cover for ${title}:`, error);
    return { googleImage: '', previewLink: '' };
  }
};

function createBookDetails(book, countrySpecificData) {
  return {
    bookDataObjectId: book._id.toString(),
    title: book.title,
    author: book.author,
    genres: book.genres,
    bookImage: countrySpecificData.bookImage,
    previewLink: book.previewLink,
    amazonLink: countrySpecificData.amazonLink,
    amazonStarRating: countrySpecificData.amazonStarRating,
    amazonReviewCount: countrySpecificData.amazonReviewCount
  };
}

function updateBookWithAmazonData(book, amazonData, countryKey, title, author) {
  const fallbackAmazonLink = `https://www.amazon.${countryKey === 'IN' ? 'in' : 'com'}/s?k=${encodeURIComponent(`${title.trim()} by ${author.trim()}`)}`;
  
  if (!book.countrySpecific) {
    book.countrySpecific = {};
  }

  // Initialize the country specific structure without the bookImage
  const countrySpecificData = {
    amazonLink: amazonData.amazonLink || fallbackAmazonLink,
    amazonStarRating: amazonData.amazonStarRating,
    amazonReviewCount: amazonData.amazonReviewCount
  };

  // Only add bookImage if amazonImage is not a blank string
  if (amazonData.amazonImage !== '') {
    countrySpecificData.bookImage = amazonData.amazonImage;
  }

  // Assign the possibly updated country specific data to the book
  book.countrySpecific[countryKey] = countrySpecificData;
}

function createNewBook(title, author, amazonData, googleData, countryKey, genres) {
  const fallbackAmazonLink = `https://www.amazon.${countryKey === 'IN' ? 'in' : 'com'}/s?k=${encodeURIComponent(`${title.trim()} by ${author.trim()}`)}`;
  return new BookData({
    title,
    author,
    previewLink: googleData.previewLink,
    countrySpecific: {
      [countryKey]: {
        bookImage: amazonData.amazonImage || googleData.googleImage,
        amazonLink: amazonData.amazonLink || fallbackAmazonLink,
        amazonStarRating: amazonData.amazonStarRating,
        amazonReviewCount: amazonData.amazonReviewCount
      }
    },
    genres
  });
}

function escapeRegExp(string) {
  // This function adds a backslash before special characters for RegExp
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const getBookData = async (title, author, userCountry, bookDataObjectId = '') => {
  try {
    const escapedTitle = escapeRegExp(title);
    const escapedAuthor = escapeRegExp(author);
    const countryKey = userCountry === 'India' ? 'IN' : 'US';
    let cacheKey = `book-data:${bookDataObjectId || title.toLowerCase()}:${countryKey}`;

    // Check if the data is available in Redis cache
    let cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    let query = bookDataObjectId 
      ? { _id: new ObjectId(bookDataObjectId) }
      : { title: { $regex: new RegExp('^' + escapedTitle + '$', 'i') }, author: { $regex: new RegExp('^' + escapedAuthor + '$', 'i') } };

    let existingBook = await BookData.findOne(query);

    if (existingBook && existingBook.countrySpecific && existingBook.countrySpecific[countryKey] && existingBook.countrySpecific[countryKey].amazonLink && existingBook.countrySpecific[countryKey].amazonLink.trim() !== '') {
      const countrySpecificData = existingBook.countrySpecific[countryKey];
      let bookDetails = createBookDetails(existingBook, countrySpecificData);
      await redisClient.set(cacheKey, JSON.stringify(bookDetails));
      return bookDetails;
    } else if (existingBook) {

      const amazonData = await getAmazonBookData(title, author, userCountry);
      updateBookWithAmazonData(existingBook, amazonData, countryKey, title, author);
    } else {
      
      const amazonData = await getAmazonBookData(title, author, userCountry);
      const googleData = await getGoogleBookData(title, author);
      const genres = await openaiApi.getGenres(title, author);
      existingBook = createNewBook(title, author, amazonData, googleData, countryKey, genres);
    }

    await existingBook.save();

    let bookData = createBookDetails(existingBook, existingBook.countrySpecific[countryKey]);
    await redisClient.set(cacheKey, JSON.stringify(bookData));

    return bookData;
  } catch (error) {
    console.error('Error during book data aggregation:', error);

    // Log the error in the BookDataErrorLog collection
    const errorLogEntry = new BookDataErrorLog({
      bookDataObjectId,
      title,
      author,
      userCountry,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });

    // Save the error log asynchronously without waiting for it to finish
    errorLogEntry.save().catch(logError => console.error('Error logging to BookDataErrorLog:', logError));

    return {
      bookDataObjectId: '',
      title: '',
      author: '',
      bookImage: '',
      previewLink: '',
      amazonLink: '',
      amazonStarRating: 'Unknown',
      amazonReviewCount: 'Unknown',
      genres: []  // Ensuring genres is included even in error scenarios
    };    
  }
};

function createBuyNowButtonHtml(link, buttonText = 'Buy Now') {
  return `<div><a href="${link}" target="_blank"><button class="buy-now-button">${buttonText}</button></a></div>`;
}

let isStreamingActive = false;

const openaiApi = async (messages, socket, session, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, bookDataObjectId, bookTitle, author, moreBooks) => {

  isStreamingActive = true;

  const filteredMessages = messages.map(({ role, content }) => ({ role, content }));
  try {
    const userCountry = session ? session.user.country : undefined;

    const stream = await openai.chat.completions.create({
      model: "gpt-4-turbo", 
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
      const { bookImage, amazonLink, amazonStarRating, amazonReviewCount } = await getBookData(bookTitle, author, userCountry, bookDataObjectId);
      const bookInfoHtml = createBookInfoHtml(bookTitle, author, amazonStarRating, amazonReviewCount);
      let imageDiv = '';
      if (bookImage) {
        imageDiv = `<div><img src="${bookImage}" alt=""></div>`;  
      } else {
        imageDiv = `<div><img src="/blank_image.png" alt="" style="border: 0.7px solid grey;"></div>`;  
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
          const { bookDataObjectId, bookImage, previewLink, amazonLink, amazonStarRating, amazonReviewCount } = await getBookData(bookTitle, author, userCountry);
          
          const buyNowButtonHtml = createBuyNowButtonHtml(amazonLink);

          let imageSource = bookImage;
          let imageDiv = '';
          if (imageSource) {
            imageDiv = `<div class="image-container"><img src="${imageSource}" alt=""></div>`;
          } else {
            imageDiv = `<div class="image-container"><img src="/blank_image.png" alt="" style="border: 0.7px solid grey;"></div>`;
          }

          if (isMoreDetails || messages[messages.length - 1].content.startsWith("Explain the book - ")) {
            pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookTitleMatch[0] + buyNowButtonHtml);
          } else {
            const moreDetailsButtonHtml = `<div><button type="button" class="more-details-btn" data-bookDataObjectId="${bookDataObjectId}" data-book-title="${bookTitle}" data-author="${author}">Book Info</button></div>`;
            const keyInsightsButtonHtml = `<div><button type="button" class="key-insights-btn" data-bookDataObjectId="${bookDataObjectId}" data-book-title="${bookTitle}" data-author="${author}">Insights</button></div>`;
            const anecdotesButtonHtml = `<div><button type="button" class="anecdotes-btn" data-bookDataObjectId="${bookDataObjectId}" data-book-title="${bookTitle}" data-author="${author}">Anecdotes</button></div>`;
            const quotesButtonHtml = `<div><button type="button" class="quotes-btn" data-bookDataObjectId="${bookDataObjectId}" data-book-title="${bookTitle}" data-author="${author}">Quotes</button></div>`;
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
          if (moreBooks || (!isMoreDetails && !isKeyInsights && !isAnecdotes && !isQuotes) ) {
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
            bookDataObjectId,
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
            bookDataObjectId,
            bookTitle,
            keyInsights: completeResponse // Save complete response here
          });
          if ( checkFormatKeyInsights(completeResponse) ) {
            await newDetail.save();
          }
        } else if (isAnecdotes) {
          const Anecdotes = require('./models/models-chat/Anecdotes');
          const newDetail = new Anecdotes({
            bookDataObjectId,
            bookTitle,
            anecdotes: completeResponse // Save complete response here
          });
          if ( checkFormatAnecdotes(completeResponse) ) {
            await newDetail.save();
          }
        } else if (isQuotes) {
          const Quotes = require('./models/models-chat/Quotes');
          const newDetail = new Quotes({
            bookDataObjectId,
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
      model: "gpt-3.5-turbo-0125",
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

openaiApi.getGenres = async (title, author) => {
  try {
    const prompt = `Provide the genres of the book - "${title}" by ${author}. The answer should just be a single array of strings and nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: 'system', content: prompt }]
    });

    let genresResponse = response.choices[0]?.message?.content || "[]";

    // Parse the JSON string into an array
    let genresArray = JSON.parse(genresResponse);

    // Ensure that genresArray is actually an array, if not, default to an empty array
    if (!Array.isArray(genresArray)) {
      genresArray = [];
    }

    return genresArray;
  } catch (error) {
    console.error('Error getting genres:', error);
    return [];
  }
};


openaiApi.stopStream = () => {
  isStreamingActive = false; // Set the flag to false to stop the stream
};

module.exports = openaiApi;




