// openaiApi.js
const { OpenAI } = require('openai');

require('dotenv').config();
const openai = new OpenAI(process.env.OPENAI_API_KEY);

const axios = require('axios');
const BookData = require('./models/models-chat/BookData'); 
const redisClient = require('./redisClient');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const parseBookTitle = (bookTitleWithAuthor) => {
  // Remove any occurrences of opening or closing quotes
  const cleanedTitle = bookTitleWithAuthor.replace(/"/g, '');

  // Split the cleaned title into book title and author
  const splitTitle = cleanedTitle.split(' by ');
  const bookTitle = splitTitle[0];
  const author = splitTitle.length > 1 ? splitTitle[1] : null;

  return { bookTitle, author };
};

function checkFormatMoreDetails(content) {
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const bodyChildren = Array.from(document.body.children);

  // Adjusting for the new expected structure size
  if (bodyChildren.length !== 9) return false;

  // Reusing the initial checks for book info, image, and buy button from the reference function
  const bookInfo = bodyChildren[0];
  if (!bookInfo.classList.contains("book-info")) return false;
  const bookTitle = bookInfo.querySelector("h3.book-title");
  const bookAuthor = bookInfo.querySelector("span.book-author");
  const ratingsAndReview = bookInfo.querySelector("div.ratings-and-review");

  const validBookInfoChildren = Array.from(bookInfo.children).filter(child => 
    child.matches("h3.book-title, span.book-author") || 
    (child.matches("div.ratings-and-review") && !ratingsAndReview.nextSibling)
  );
  if (validBookInfoChildren.length < 2 || validBookInfoChildren.length > 3) return false;

  const imgContainer = bodyChildren[1];
  if (imgContainer.tagName !== "DIV" || imgContainer.children.length !== 1 || imgContainer.children[0].tagName !== "IMG") return false;

  const buyNowContainer = bodyChildren[2];
  if (buyNowContainer.tagName !== "DIV" || buyNowContainer.children.length !== 1 || buyNowContainer.children[0].tagName !== "A") return false;
  const buyNowButton = buyNowContainer.querySelector("button.buy-now-button");
  if (!buyNowButton) return false;

  // Adjusting checks for the additional sections: Book Summary, Author's Credibility, and Endorsements
  // Check for Book Summary
  const bookSummaryH3 = bodyChildren[3];
  const bookSummaryP = bodyChildren[4];
  if (bookSummaryH3.tagName !== "H3" || bookSummaryP.tagName !== "P") return false;

  // Check for Author's Credibility
  const authorCredibilityH3 = bodyChildren[5];
  const authorCredibilityP = bodyChildren[6];
  if (authorCredibilityH3.tagName !== "H3" || authorCredibilityP.tagName !== "P") return false;

  // Check for Endorsements and Praise
  const endorsementsH3 = bodyChildren[7];
  const endorsementsP = bodyChildren[8];
  if (endorsementsH3.tagName !== "H3" || endorsementsP.tagName !== "P") return false;

  return true; // All checks passed
}

function checkFormatKeyInsights(content) {
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const bodyChildren = Array.from(document.body.children);

  if (bodyChildren.length !== 5) return false; // Ensuring there are exactly 5 elements at this level

  // Check 1: div.book-info with specific children
  const bookInfo = bodyChildren[0];
  if (!bookInfo.classList.contains("book-info")) return false;
  const bookTitle = bookInfo.querySelector("h3.book-title");
  const bookAuthor = bookInfo.querySelector("span.book-author");
  const ratingsAndReview = bookInfo.querySelector("div.ratings-and-review");

  // Allow for the optional presence of exactly one ratings-and-review div
  const validBookInfoChildren = Array.from(bookInfo.children).filter(child => 
    child.matches("h3.book-title, span.book-author") || 
    (child.matches("div.ratings-and-review") && !ratingsAndReview.nextSibling) // Ensure there's only one ratings-and-review div and it's the last child if present
  );

  if (validBookInfoChildren.length < 2 || validBookInfoChildren.length > 3) return false;

  // Check 2: div > img
  const imgContainer = bodyChildren[1];
  if (imgContainer.tagName !== "DIV" || imgContainer.children.length !== 1 || imgContainer.children[0].tagName !== "IMG") return false;

  // Check 3: div > a > button.buy-now-button
  const buyNowContainer = bodyChildren[2];
  if (buyNowContainer.tagName !== "DIV" || buyNowContainer.children.length !== 1 || buyNowContainer.children[0].tagName !== "A") return false;
  const buyNowButton = buyNowContainer.querySelector("button.buy-now-button");
  if (!buyNowButton) return false;

  // Check 4: h3 with "Key Insights"
  const keyInsightsH3 = bodyChildren[3];
  if (keyInsightsH3.tagName !== "H3" || !keyInsightsH3.textContent.includes("Key Insights")) return false;

  // Check 5: ol > li
  const insightsList = bodyChildren[4];
  if (insightsList.tagName !== "OL" || insightsList.children.length === 0) return false;
  for (const item of insightsList.children) {
    if (item.tagName !== "LI") return false; // Ensuring every child of the list is a list item
  }

  return true; // All checks passed
}

function checkFormatAnecdotes(content) {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const bodyChildren = Array.from(document.body.children);

  if (bodyChildren.length !== 5) return false; // Ensuring there are exactly 5 elements at this level

  // Check 1: div.book-info with specific children
  const bookInfo = bodyChildren[0];
  if (!bookInfo.classList.contains("book-info")) return false;
  const bookTitle = bookInfo.querySelector("h3.book-title");
  const bookAuthor = bookInfo.querySelector("span.book-author");
  const ratingsAndReview = bookInfo.querySelector("div.ratings-and-review");

  const validBookInfoChildren = Array.from(bookInfo.children).filter(child => 
    child.matches("h3.book-title, span.book-author") || 
    (child.matches("div.ratings-and-review") && !ratingsAndReview.nextSibling)
  );

  if (validBookInfoChildren.length < 2 || validBookInfoChildren.length > 3) return false;

  // Check 2: div > img
  const imgContainer = bodyChildren[1];
  if (imgContainer.tagName !== "DIV" || imgContainer.children.length !== 1 || imgContainer.children[0].tagName !== "IMG") return false;

  // Check 3: div > a > button.buy-now-button
  const buyNowContainer = bodyChildren[2];
  if (buyNowContainer.tagName !== "DIV" || buyNowContainer.children.length !== 1 || buyNowContainer.children[0].tagName !== "A") return false;
  const buyNowButton = buyNowContainer.querySelector("button.buy-now-button");
  if (!buyNowButton) return false;

  // Check 4: h3 with "Key Anecdotes" text
  const keyAnecdotesH3 = bodyChildren[3];
  if (keyAnecdotesH3.tagName !== "H3" || !keyAnecdotesH3.textContent.includes("Key Anecdotes")) return false;

  // Check 5: ol > li, ensuring at least one li is present
  const listItems = bodyChildren[4];
  if (listItems.tagName !== "OL" || listItems.children.length === 0) return false;

  return true; // All checks passed
}


function checkFormatQuotes(content) {
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const bodyChildren = Array.from(document.body.children);

  if (bodyChildren.length !== 5) return false; // Ensuring there are exactly 5 elements at this level

  // Check 1: div.book-info with specific children
  const bookInfo = bodyChildren[0];
  if (!bookInfo.classList.contains("book-info")) return false;
  const bookTitle = bookInfo.querySelector("h3.book-title");
  const bookAuthor = bookInfo.querySelector("span.book-author");
  const ratingsAndReview = bookInfo.querySelector("div.ratings-and-review");

  // Allow for the optional presence of exactly one ratings-and-review div
  const validBookInfoChildren = Array.from(bookInfo.children).filter(child => 
    child.matches("h3.book-title, span.book-author") || 
    (child.matches("div.ratings-and-review") && !ratingsAndReview.nextSibling) // Ensure there's only one ratings-and-review div and it's the last child if present
  );

  if (validBookInfoChildren.length < 2 || validBookInfoChildren.length > 3) return false;

  // Check 2: div > img
  const imgContainer = bodyChildren[1];
  if (imgContainer.tagName !== "DIV" || imgContainer.children.length !== 1 || imgContainer.children[0].tagName !== "IMG") return false;

  // Check 3: div > a > button.buy-now-button
  const buyNowContainer = bodyChildren[2];
  if (buyNowContainer.tagName !== "DIV" || buyNowContainer.children.length !== 1 || buyNowContainer.children[0].tagName !== "A") return false;
  const buyNowButton = buyNowContainer.querySelector("button.buy-now-button");
  if (!buyNowButton) return false;

  // Check 4: h3
  const keyQuotesH3 = bodyChildren[3];
  if (keyQuotesH3.tagName !== "H3") return false;

  // Check 5: ol > li
  const listItems = bodyChildren[4];
  if (listItems.tagName !== "OL" || listItems.children.length === 0) return false;

  return true; // All checks passed
}

function createPreviewButtonHtml(isbn, isEmbeddable) {
  const disabledStyles = `style="cursor: not-allowed; opacity: 0.5; pointer-events: none;"`;
  const buttonStyles = isEmbeddable ? "" : disabledStyles;

  return `<div><button type="button" class="preview-btn" data-isbn="${isbn}" ${buttonStyles}>Preview</button></div>`;
};

function createBookInfoHtml(bookTitle, author, amazonStarRating, amazonReviewCount) {

  let bookInfoHtml = `<div class="book-info">
      <h3 class="book-title">${bookTitle}</h3>`;

  // If author exists, add author information
  if (author) {
    bookInfoHtml += `<span class="book-author">by ${author}</span>`;
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


async function getAmazonBookData(title) {
  try {
    const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
      params: {
        key: process.env.REACT_APP_GOOGLE_CUSTOM_SEARCH_API_KEY,
        cx: process.env.GOOGLE_CSE_ID,
        q: `site:amazon.in ${title}`,
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

      if (!itemTitleLower.includes(searchTitleLower) && !searchTitleLower.includes(itemTitleLower)) {
        console.log('Title does not match the search');
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
    let embeddable = false;

    if (response.data.items?.length) {
      const filteredBooks = response.data.items.filter(item => {
        const itemTitleLower = item.volumeInfo.title.toLowerCase();
        const searchTitleLower = title.toLowerCase();
        return itemTitleLower.includes(searchTitleLower) || searchTitleLower.includes(itemTitleLower);
      });

      const englishBooks = filteredBooks.filter(item => item.volumeInfo.language === 'en');
      const book = englishBooks.find(item => item.accessInfo.embeddable) || englishBooks[0];
      if (book) {
        embeddable = book.accessInfo.embeddable;
    
        const { volumeInfo } = book;
        const foundIsbn = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier;
        if (foundIsbn) isbn = foundIsbn;

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
    return { googleImage, isbn, embeddable};

  } catch (error) {
    console.error(`Error fetching book cover for ${title}:`, error);
    return { googleImage: '', isbn: '', embeddable: false };
  }
};

// const getGenreData = async (title) => {
//   try {
//     const prompt = `Respond with just a single array of strings containing genres for the book - "${title}".`;

//     const response = await openai.chat.completions.create({
//       model: "gpt-4-1106-preview",
//       messages: [{ role: 'system', content: prompt }],
//       max_tokens: 100, 
//     });

//     let genresText = response.choices[0]?.message?.content.trim();
//     // console.log("genresText is: ", genresText);

//     // Simple regex to match an array format like ["Genre 1", "Genre 2"]
//     const arrayRegex = /\["[^"]+"(, "[^"]+")*\]/;
//     const match = genresText.match(arrayRegex);
  
//     let genresArray;
//     if (match) {
//       try {
//         genresArray = JSON.parse(match[0]);
//       } catch (error) {
//         console.error('Failed to parse genres as JSON:', error);
//         genresArray = []; // Default to an empty array if parsing fails
//       }
//     } else {
//       console.error('No valid JSON array found in the response');
//       genresArray = []; // Default to an empty array if no array is found
//     }
    
//     return genresArray;
//   } catch (error) {
//     console.error('Error fetching genre data:', error);
//     return []; // Return an empty array in case of error
//   }
// };

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
        embeddable: existingBook.embeddable,
        amazonLink: existingBook.amazonLink,
        amazonStarRating: existingBook.amazonStarRating,
        amazonReviewCount: existingBook.amazonReviewCount
      };

      await redisClient.set(cacheKey, JSON.stringify(bookDetails));

      return bookDetails;
    }
    
    const amazonData = await getAmazonBookData(title);
    const googleData = await getGoogleBookData(title);
    const genreData = await getGenreData(title); 

    const amazonLink = amazonData.amazonLink || `https://www.amazon.in/s?k=${encodeURIComponent(title.trim())}`;

    // Merge data
    const bookData = {
      isbn: googleData.isbn,
      title: title,
      author: author,
      bookImage: amazonData.amazonImage || googleData.googleImage, // Choose one based on availability or preference
      embeddable: googleData.embeddable,
      amazonLink: amazonLink,
      amazonStarRating: amazonData.amazonStarRating,
      amazonReviewCount: amazonData.amazonReviewCount,
      genres: genreData,
    };

    // Save merged data
    const newBookData = new BookData(bookData);
    await newBookData.save();

    return bookData;
  } catch (error) {
    console.error('Error during book data aggregation:', error);
    return { isbn: '', title: '', author: '', bookImage: '', embeddable: false, amazonLink: '', amazonStarRating: 'Unknown', amazonReviewCount: 'Unknown' };
  }
};




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
      const buyNowButtonHtml = `<div><a href="${amazonLink}" target="_blank"><button class="buy-now-button">Buy Now</button></a></div>`;
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
          const { isbn, bookImage, embeddable, amazonLink, amazonStarRating, amazonReviewCount } = await getBookData(bookTitle, author);
          const buyNowButtonHtml = `<div><a href="${amazonLink}" target="_blank"><button class="buy-now-button">Buy Now</button></a></div>`;

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
            const previewButtonHtml = createPreviewButtonHtml(isbn, embeddable);

            const buttonsHtml = buyNowButtonHtml + moreDetailsButtonHtml + keyInsightsButtonHtml + anecdotesButtonHtml + quotesButtonHtml + previewButtonHtml;
            const buttonsDiv = `<div class="buttons-container">${buttonsHtml}</div>`;

            const contentDiv = `<div class="content-container">${imageDiv}${buttonsDiv}</div>`;

            pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookTitleMatch[0] + contentDiv);
          }

          const bookInfoHtml = createBookInfoHtml(bookTitle, author, amazonStarRating, amazonReviewCount);
          pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookInfoHtml);
          pausedEmit = pausedEmit.replace(/\#/g, '');
                    
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




