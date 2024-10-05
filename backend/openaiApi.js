// openaiApi.js
const { OpenAI } = require('openai');
require('dotenv').config();
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const axios = require('axios');
const BookData = require('./models/models-chat/BookData'); 
const redisClient = require('./redisClient');
const mongoose = require('mongoose');
// const fs = require('fs');
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

function createPreviewButtonHtml(previewLink, bookTitle, author) {
  const disabledStyles = `style="cursor: not-allowed; opacity: 0.5; pointer-events: none;"`;
  const isEnabled = previewLink !== '';
  const buttonStyles = isEnabled ? "" : disabledStyles;
  const dataAttributes = isEnabled ? `data-preview-link="${previewLink}" data-book-title="${bookTitle}" data-author="${author}"` : "";

  return `<div><button type="button" class="preview-btn" ${buttonStyles} ${dataAttributes}>Preview</button></div>`;
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
  if (amazonReviewCount !== '' && amazonReviewCount !== '0' && amazonStarRating != null) {
    bookInfoHtml += `<div class="ratings-and-review">`;

    // Add star rating
    if (amazonStarRating && amazonStarRating !== '') { 
      bookInfoHtml += renderStarRatingHtml(amazonStarRating);
    }

    // If review count exists, add review count information
    if (amazonReviewCount && amazonReviewCount !== '') {
      bookInfoHtml += `<span class="review-count">${amazonReviewCount}</span>`;
    }

    bookInfoHtml += `</div>`; // Close ratings-and-review div
  }

  // Close the book-info div
  bookInfoHtml += `</div>`;

  return bookInfoHtml;
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

const countryCodes = {
  'India': 'IN',
  'United States': 'US',
  'United Kingdom': 'GB',
  'Germany': 'DE',
  'Canada': 'CA',
  'France': 'FR',
  'Japan': 'JP',
  'Netherlands': 'NL',
  'Sweden': 'SE'
};

const amazonDomains = {
  'IN': 'in',
  'US': 'com',
  'GB': 'co.uk',
  'DE': 'de',
  'CA': 'ca',
  'FR': 'fr',
  'JP': 'co.jp',
  'NL': 'nl',
  'SE': 'se'
};

const getCountryCode = (countryName) => {
  return countryCodes[countryName] || 'US'; // Default to 'US' if country not found
};

async function fetchAmazonData(query, countryCode) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodedQuery}&page=1&country=${countryCode}&sort_by=RELEVANCE&product_condition=ALL`;

  try {
    const response = await axios.get(url, {
      headers: {
        'x-rapidapi-host': process.env.RAPIDAPI_HOST,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      }
    });

    if (response.data && response.data.data && response.data.data.products.length > 0) {
      const product = response.data.data.products[0];
      const {
        product_star_rating,
        product_num_ratings,
        product_url,
        product_photo,
        product_price
      } = product;

      const numericPrice = product_price ? parseInt(product_price.replace(/[^0-9.]+/g, "")) : 0;
      const amazonPrice = numericPrice ? `₹${numericPrice.toLocaleString('en-IN')}` : "";

      return {
        amazonLink: product_url,
        amazonStarRating: product_star_rating,
        amazonReviewCount: product_num_ratings.toLocaleString(),
        amazonImage: product_photo,
        amazonPrice
      };
    } else {
      console.log('No products found or "products" is undefined.');
    }
  } catch (error) {
    console.error('Error during API request:', error);
  }

  return {
    amazonLink: '',
    amazonStarRating: '',
    amazonReviewCount: '',
    amazonImage: '',
    amazonPrice: ''
  };
}

async function getAmazonBookData(title, author, countryCode, amazonDataChecked) {
  if (amazonDataChecked) {
    return { amazonLink: '', amazonStarRating: '', amazonReviewCount: '', amazonImage: '', amazonPrice: '' };
  }

  function modifyTitle(title) {
    const colonIndex = title.indexOf(':');
    if (colonIndex !== -1) {
      const subtitle = title.substring(colonIndex + 1).trim();
      if (subtitle.length > 60) {
        return title.substring(0, colonIndex).trim();
      }
    }
    return title;
  }

  const modifiedTitle = modifyTitle(title);
  const authorBeforeAnd = getAuthorBeforeAnd(author);
  const query_one = `${modifiedTitle} by ${authorBeforeAnd}`;
  // const query_two = `${modifiedTitle} by ${authorBeforeAnd} paperback`;

  const amazonData = await fetchAmazonData(query_one, countryCode);
  // if (amazonData.amazonLink) {
  //   const priceData = await fetchAmazonData(query_two, countryCode);
  //   amazonData.amazonPrice = priceData.amazonPrice;
  // }

  return amazonData;
}

const getGoogleBookData = async (title, author) => {
  try {
    const authorBeforeAnd = getAuthorBeforeAnd(author);
    const query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(authorBeforeAnd)}`;
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${query}&key=${process.env.REACT_APP_GOOGLE_BOOKS_API_KEY}`);

    let googleImage = '';
    let previewLink = '';


    if (response.data.items?.length) {
      // console.log("response.data.items is", response.data.items);
      
      const book = response.data.items?.find(item => item.accessInfo.viewability !== 'NO_PAGES');
        
      if (book) {
        const { volumeInfo } = book;
        previewLink = volumeInfo.previewLink;

        // console.log("previewLink is ", previewLink);

        // Create a URL object from the previewLink
        const url = new URL(previewLink);

        // Set the URL protocol to 'https:'
        url.protocol = "https:";

        // Set parameters to desired values
        url.searchParams.set('printsec', 'frontcover');
        url.searchParams.set('f', 'true');

        // Remove parameters that are not needed
        url.searchParams.delete('dq');
        url.searchParams.delete('q');

        // Update the previewLink with all changes
        previewLink = url.toString();

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
    amazonReviewCount: countrySpecificData.amazonReviewCount,
    amazonPrice: countrySpecificData.amazonPrice
  };
}

function updateBookWithAmazonData(book, amazonData, countryKey, title, author) {
  const amazonDomain = amazonDomains[countryKey] || 'com';
  const fallbackAmazonLink = `https://www.amazon.${amazonDomain}/s?k=${encodeURIComponent(`${title.trim()} by ${author.trim()}`)}`;
  
  if (!book.countrySpecific) {
    book.countrySpecific = {};
  }

  // Initialize the country specific structure without the bookImage
  const countrySpecificData = {
    amazonLink: amazonData.amazonLink || fallbackAmazonLink,
    amazonStarRating: amazonData.amazonStarRating,
    amazonReviewCount: amazonData.amazonReviewCount,
    amazonPrice: amazonData.amazonPrice,
    amazonDataChecked: true
  };

  // Only add bookImage if amazonImage is not a blank string
  if (amazonData.amazonImage !== '') {
    countrySpecificData.bookImage = amazonData.amazonImage;
  }

  // Assign the possibly updated country specific data to the book
  book.countrySpecific[countryKey] = countrySpecificData;
}

function createNewBook(title, author, amazonData, googleData, countryKey, genres) {
  const amazonDomain = amazonDomains[countryKey] || 'com';
  const fallbackAmazonLink = `https://www.amazon.${amazonDomain}/s?k=${encodeURIComponent(`${title.trim()} by ${author.trim()}`)}`;
  
  return new BookData({
    title,
    author,
    previewLink: googleData.previewLink,
    countrySpecific: {
      [countryKey]: {
        bookImage: amazonData.amazonImage || googleData.googleImage,
        amazonLink: amazonData.amazonLink || fallbackAmazonLink,
        amazonStarRating: amazonData.amazonStarRating,
        amazonReviewCount: amazonData.amazonReviewCount,
        amazonPrice: amazonData.amazonPrice,
        amazonDataChecked: true
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
    const countryKey = getCountryCode(userCountry);
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

    if (existingBook && existingBook.countrySpecific && existingBook.countrySpecific[countryKey] && existingBook.countrySpecific[countryKey].amazonPrice && existingBook.countrySpecific[countryKey].amazonPrice.trim() !== '') {
      const countrySpecificData = existingBook.countrySpecific[countryKey];
      let bookDetails = createBookDetails(existingBook, countrySpecificData);
      await redisClient.set(cacheKey, JSON.stringify(bookDetails));
      return bookDetails;
    } else if (existingBook) {

      const amazonDataChecked = existingBook.countrySpecific && existingBook.countrySpecific[countryKey] && existingBook.countrySpecific[countryKey].hasOwnProperty('amazonDataChecked') ? existingBook.countrySpecific[countryKey].amazonDataChecked : false;
      const amazonData = await getAmazonBookData(title, author, countryKey, amazonDataChecked);
      updateBookWithAmazonData(existingBook, amazonData, countryKey, title, author);
    } else {
      
      const amazonData = await getAmazonBookData(title, author, countryKey, false);
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
  }
};

function createBuyNowButtonHtml(link, bookTitle, author, getBooksPrice, AmazonButtonText = 'Buy Now', GetBooksButtonText = 'Buy Now', interactiveButton) {

  const domainMatch = link.match(/amazon\.([a-z\.]+)/i);
  const amazonDomain = domainMatch ? domainMatch[1] : 'com'; // Default to 'com' if domain is not found

  // Check if the link is a direct product link or a search query link
  const isSearchLink = link.includes('/s?k=');

  // Format the Amazon link based on the type of URL
  let amazonLink;
  if (isSearchLink) {
    // For search links, directly append the affiliate tag
    amazonLink = `https://www.amazon.${amazonDomain}/s?k=${encodeURIComponent(`${bookTitle.trim()} by ${author.trim()}`)}&tag=getbooksai-21`;
  } else {
    // For direct product links, append /ref=nosim and the affiliate tag as specified
    amazonLink = `${link}/ref=nosim?tag=getbooksai-21`;
  }

  let getBooksButtonHtml = '';
  if (!interactiveButton) {
     getBooksButtonHtml = GetBooksButtonText !== "GetBooks ₹0" ? `<div>
            <button class="getbooks-buy-now-button" onClick={toggleModal} data-book-title="${bookTitle}" data-author="${author}" data-get-books-price="${getBooksPrice}" data-amazon-link="${amazonLink}">
              ${GetBooksButtonText}
            </button>
          </div>` : `<div>
          <button class="getbooks-buy-now-button-invisible" onClick={toggleModal} data-book-title="${bookTitle}" data-author="${author}" data-get-books-price="${getBooksPrice}" data-amazon-link="${amazonLink}">
            GetBooks ₹99
          </button>
        </div>`;
  }
  
  return `${getBooksButtonHtml}
          <div><a href="${amazonLink}" target="_blank">
            <button class="buy-now-button" data-book-title="${bookTitle}" data-author="${author}">
              ${AmazonButtonText}
            </button>
          </a></div>`;
}

let isStreamingActive = false;

const openaiApi = async (messages, socket, session, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, bookDataObjectId, bookTitle, author, moreBooks, userDataCountry, bookData) => {

  isStreamingActive = true;

  const filteredMessages = messages.map(({ role, content }) => ({ role, content }));
  try {
    const userCountry = userDataCountry;

    const stream = await openai.chat.completions.create({
      model: "gpt-4", 
      messages: filteredMessages,
      stream: true,
    });    

    let completeResponse = "";
    // let totalResponse = "";
    let pausedEmit = ""; // Variable to hold paused chunks
    let isPaused = false; // Flag to check if emitting is paused

    if (isKeyInsights || isAnecdotes || isQuotes || isMoreDetails) {
      const { bookImage, amazonLink, amazonStarRating, amazonReviewCount, AmazonButtonText } = bookData;

      const bookInfoHtml = createBookInfoHtml(bookTitle, author, amazonStarRating, amazonReviewCount);
      let imageDiv = '';
      if (bookImage) {
        imageDiv = `<div><img src="${bookImage}" alt=""></div>`;  
      } else {
        imageDiv = `<div><img src="/blank_image.png" alt="" style="border: 0.7px solid grey;"></div>`;  
      }

      const amazonPrice = AmazonButtonText ? AmazonButtonText.replace('Amazon ₹', '').trim() : '0'; // Extract the price from AmazonButtonText
      const numericPrice = Number(amazonPrice); // Convert the extracted price to a number
      const getBooksPrice = Math.floor(numericPrice / 2);
      const GetBooksButtonText = `GetBooks ₹${getBooksPrice}`;
      const buyNowButtonHtml = createBuyNowButtonHtml(amazonLink, bookTitle, author, getBooksPrice, AmazonButtonText, GetBooksButtonText, true);
      completeResponse = bookInfoHtml + imageDiv + buyNowButtonHtml;
      socket.emit('chunk', { content: completeResponse, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, moreBooks });
    }

    for await (const chunk of stream) {
      if (!isStreamingActive) {
        if (!isMoreDetails && !isKeyInsights && !isAnecdotes && !isQuotes) {
          let messageIndex;
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
          session.messages[messageIndex].content += completeResponse;
          await session.save();
        }
        break;
      } 
      let chunkContent = chunk.choices[0]?.delta?.content || "";
      // console.log(chunkContent);
      // totalResponse += chunkContent;

      if (chunkContent.includes('#')) {
        if (isPaused) {
          // If resuming, add current chunk to pausedEmit
          pausedEmit += chunkContent;

          // Extract book title enclosed in '#'
          let bookTitleMatch = pausedEmit.match(/#(?:\d+\.\s)?(.*?)#/);
          const bookTitleWithAuthor = bookTitleMatch ? bookTitleMatch[1] : "";
          const { bookTitle, author } = parseBookTitle(bookTitleWithAuthor);
          const { bookDataObjectId, bookImage, previewLink, amazonLink, amazonStarRating, amazonReviewCount, amazonPrice } = await getBookData(bookTitle, author, userCountry);
          
          const AmazonButtonText = `Amazon ${amazonPrice}`;
          const numericPrice = Number(amazonPrice.replace('₹', '').trim());
          const getBooksPrice = Math.floor(numericPrice / 2);
          const GetBooksButtonText = `GetBooks ₹${getBooksPrice}`; 
          const buyNowButtonHtml = createBuyNowButtonHtml(amazonLink, bookTitle, author, getBooksPrice, AmazonButtonText, GetBooksButtonText, false);

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
            const previewButtonHtml = createPreviewButtonHtml(previewLink, bookTitle, author);

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
        socket.emit('chunk', { content: chunkContent, sessionId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, moreBooks });
      }
      
      const finishReason = chunk.choices[0]?.finish_reason;
      if (finishReason === 'stop') {
        // console.log("totalResponse is", totalResponse);
        if (!isMoreDetails && !isKeyInsights && !isAnecdotes && !isQuotes) {
          let messageIndex;
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
          session.messages[messageIndex].content += completeResponse;
          await session.save();
        }

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
      model: "gpt-4o-mini",
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
  // try {
  //   const prompt = `Provide the genres of the book - "${title}" by ${author}. The answer should just be a single array of strings and nothing else.`;

  //   const response = await openai.chat.completions.create({
  //     model: "gpt-4o-mini-2024-07-18",
  //     messages: [{ role: 'system', content: prompt }]
  //   });

  //   let genresResponse = response.choices[0]?.message?.content || "[]";

  //   // Parse the JSON string into an array
  //   let genresArray = JSON.parse(genresResponse);

  //   // Ensure that genresArray is actually an array, if not, default to an empty array
  //   if (!Array.isArray(genresArray)) {
  //     genresArray = [];
  //   }
 
  //   return genresArray;
  // } catch (error) {
  //   console.error('Error getting genres:', error);
    return [];
  // }
};


openaiApi.stopStream = () => {
  isStreamingActive = false; // Set the flag to false to stop the stream
};

module.exports = openaiApi;




