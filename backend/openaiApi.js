// openaiApi.js
const { OpenAI } = require('openai');
require('dotenv').config();

const axios = require('axios');
const GoogleBookData = require('./models/models-chat/GoogleBookData'); 
const AmazonBookData = require('./models/models-chat/AmazonBookData');

const parseBookTitle = (bookTitleWithAuthor) => {
  // Remove any occurrences of opening or closing quotes
  const cleanedTitle = bookTitleWithAuthor.replace(/"/g, '');

  // Split the cleaned title into book title and author
  const splitTitle = cleanedTitle.split(' by ');
  const bookTitle = splitTitle[0];
  const author = splitTitle.length > 1 ? splitTitle[1] : null;

  return { bookTitle, author };
};

function createBuyNowButton(amazonLink, bookTitle, author) {
  // Check if amazonLink is undefined or empty
  if (!amazonLink) {
    // Encode book title and author for URL
    const encodedTitle = encodeURIComponent(bookTitle.trim());

    // Create Amazon search link
    amazonLink = `https://www.amazon.in/s?k=${encodedTitle}`;
  }

  // Return the button HTML
  return `<div><a href="${amazonLink}" target="_blank"><button class="buy-now-button">Buy Now</button></a></div>`;
}

function checkFormatMoreDetails(content) {
  const pattern = /<div class="book-info">\s*<h3 class="book-title">[^<]+<\/h3>\s*<span class="book-author">[^<]+<\/span>\s*<\/div>\s*<div>\s*<img src="[^"]+" alt="[^"]*">\s*<\/div>\s*<div>\s*<a href="[^"]+" target="_blank">\s*<button class="buy-now-button">[^<]+<\/button>\s*<\/a>\s*<\/div>\s*<h3>Book Summary<\/h3>\s*<p>[^<]+<\/p>\s*<h3>Author's Credibility<\/h3>\s*<p>[^<]+<\/p>\s*<h3>Endorsements and Praise<\/h3>\s*<p>[^<]+<\/p>/;
  return pattern.test(content);
}

function checkFormatKeyInsights(content) {
  const pattern = /<div class="book-info">\s*<h3 class="book-title">[^<]+<\/h3>\s*<span class="book-author">[^<]+<\/span>\s*<\/div>\s*<div>\s*<img src="[^"]+" alt="[^"]*">\s*<\/div>\s*<div>\s*<a href="[^"]+" target="_blank">\s*<button class="buy-now-button">[^<]+<\/button>\s*<\/a>\s*<\/div>\s*<h3>Key Insights<\/h3>\s*<ol>(?:\s*<li><strong>[^<]+<\/strong>:\s*[^<]+<\/li>\s*)+<\/ol>/;
  return pattern.test(content);                                                                                                                                                                                                                                                                       
}

function checkFormatAnecdotes(content) {
  const pattern = /<div class="book-info">\s*<h3 class="book-title">[^<]+<\/h3>\s*<span class="book-author">[^<]+<\/span>\s*<\/div>\s*<div>\s*<img src="[^"]+" alt="[^"]*">\s*<\/div>\s*<div>\s*<a href="[^"]+" target="_blank">\s*<button class="buy-now-button">[^<]+<\/button>\s*<\/a>\s*<\/div>\s*<h3>Key Anecdotes<\/h3>\s*<ol>(\s*<li>\s*<strong>[^<]+<\/strong>:\s*[^<]+\s*<\/li>)+\s*<\/ol>/;
  return pattern.test(content);
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

async function getAmazonBookData(title, author) {
  try {
    const existingBook = await AmazonBookData.findOne({ title, author });
    if (existingBook) {
      return {
        amazonLink: existingBook.amazonLink,
        amazonStarRating: existingBook.amazonStarRating,
        amazonReviewCount: existingBook.amazonReviewCount,
        amazonImage: existingBook.amazonImage // Assuming you store the image URL in the database
      };
    }

    let amazonImage = '';
    try {
      const imageResponse = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.REACT_APP_GOOGLE_CUSTOM_SEARCH_API_KEY,
          cx: process.env.GOOGLE_CSE_ID,
          q: `"${title}" book image`,
          searchType: 'image',
          fileType: 'jpg',
          num: 1
        }
      });

      if (imageResponse.data.items && imageResponse.data.items.length > 0) {
        const imageItem = imageResponse.data.items[0];
    
        // Validate the title
        if (imageItem.title.toLowerCase().includes(title.toLowerCase())) {
          amazonImage = imageItem.link;
        } else {
          console.log('Image title does not match the search');
        }
      }
    } catch (error) {
      console.error('Error during image API request:', error);
    }

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
        return { amazonLink: '', amazonStarRating: '', amazonReviewCount: '', amazonImage };
      }

      // Validate the title
      if (!item.title.toLowerCase().includes(title.toLowerCase())) {
        console.log('Title does not match the search');
        return { amazonLink: '', amazonStarRating: '', amazonReviewCount: '', amazonImage };
      }
      
      const ogImage = item.pagemap.metatags[0]['og:image'];
      const decodedOgImage = decodeURIComponent(ogImage);

      const starRatingMatch = decodedOgImage.match(/_PIStarRating(.*?),/);
      const amazonStarRating = starRatingMatch ? convertStarRating(starRatingMatch[1]) : 'Unknown';
      
      const reviewCountMatch = decodedOgImage.match(/_ZA(\d+(%2C\d+)?)/);
      const amazonReviewCount = reviewCountMatch ? reviewCountMatch[1].replace('%2C', ',') : 'Unknown';

      let amazonLink = item.pagemap.metatags[0]['og:url'];

      let url = new URL(amazonLink);
      url.hostname = 'www.amazon.in'; 
      amazonLink = url.href.split('/ref')[0];

      const newAmazonBookData = new AmazonBookData({
        title,
        author,
        amazonLink,
        amazonStarRating: amazonStarRating !== 'Unknown' ? amazonStarRating : null,
        amazonReviewCount: amazonReviewCount !== 'Unknown' ? amazonReviewCount : null,
        amazonImage // Storing the image URL
      }); 
      await newAmazonBookData.save();

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

const getGoogleBookData = async (title, author) => {
  try {
    const existingBook = await GoogleBookData.findOne({ title, author });
    if (existingBook) {
      return { 
        googleImage: existingBook.googleImage, 
        isbn: existingBook.isbn, 
        embeddable: existingBook.embeddable
      };
    }

    let query = `intitle:${encodeURIComponent(title)}`;
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${query}&key=${process.env.REACT_APP_GOOGLE_BOOKS_API_KEY}`);

    let googleImage = '';
    let isbn = '';
    let embeddable = false;

    if (response.data.items?.length) {
      const englishBooks = response.data.items.filter(item => item.volumeInfo.language === 'en');
      const book = englishBooks.find(item => item.accessInfo.embeddable) || englishBooks[0];
      embeddable = book.accessInfo.embeddable;
    
      const { volumeInfo } = book;
      const foundIsbn = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier;
      if (foundIsbn) isbn = foundIsbn;
      if (volumeInfo.imageLinks?.thumbnail) {
        googleImage = volumeInfo.imageLinks.thumbnail.replace("&edge=curl", "");
      }
    }

    const newGoogleBookData = new GoogleBookData({ 
      title,
      author,
      googleImage, 
      isbn, 
      embeddable
    }); 
    await newGoogleBookData.save();
    return { googleImage, isbn, embeddable};

  } catch (error) {
    console.error(`Error fetching book cover for ${title}:`, error);
    return { googleImage: '', isbn: '', embeddable: '' };
  }
};

const openai = new OpenAI(process.env.OPENAI_API_KEY);

let isStreamingActive = false;

const fetchMoreDetails = async (bookTitle, author) => {
  try {
    const response = await axios.get(`${process.env.BACKEND_URL}/api/more-details`, {
      params: { bookTitle, author }
    });
    return response; 
  } catch (error) {
    throw error; 
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
      const {googleImage} = await getGoogleBookData(bookTitle, author);
      const {amazonLink, amazonStarRating, amazonReviewCount, amazonImage} = await getAmazonBookData(bookTitle, author);
      const bookInfoHtml = createBookInfoHtml(bookTitle, author, amazonStarRating, amazonReviewCount);
      let imageDiv = '';
      if (amazonImage || googleImage) {
        imageDiv = `<div><img src="${amazonImage || googleImage}" alt=""></div>`;
      }
      const buyNowButtonHtml = createBuyNowButton(amazonLink, bookTitle, author);
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
          let bookTitleMatch = pausedEmit.match(/#(?:\d+\.\s)?(.*?)#/);
          const bookTitleWithAuthor = bookTitleMatch ? bookTitleMatch[1] : "";
          const { bookTitle, author } = parseBookTitle(bookTitleWithAuthor);
          const {googleImage, isbn, embeddable} = await getGoogleBookData(bookTitle, author);
          const {amazonLink, amazonStarRating, amazonReviewCount, amazonImage} = await getAmazonBookData(bookTitle, author);

          const buyNowButtonHtml = createBuyNowButton(amazonLink, bookTitle, author);

          let imageSource = amazonImage || googleImage;
          let imageDiv = '';
          if (imageSource) {
            imageDiv = `<div class="image-container"><img src="${imageSource}" alt=""></div>`;
          }

          if (isMoreDetails || messages[messages.length - 1].content.startsWith("Explain the book - ")) {
            pausedEmit = pausedEmit.replace(bookTitleMatch[0], bookTitleMatch[0] + buyNowButtonHtml);
          } else {
            const moreDetailsButtonHtml = `<div><button type="button" class="more-details-btn" data-book-title="${bookTitle}" data-author="${author}">Book Info</button></div>`;
            const keyInsightsButtonHtml = `<div><button type="button" class="key-insights-btn" data-book-title="${bookTitle}" data-author="${author}">Insights</button></div>`;
            const anecdotesButtonHtml = `<div><button type="button" class="anecdotes-btn" data-book-title="${bookTitle}" data-author="${author}">Anecdotes</button></div>`;
            const previewButtonHtml = createPreviewButtonHtml(isbn, embeddable);

            const buttonsHtml = buyNowButtonHtml + moreDetailsButtonHtml + keyInsightsButtonHtml + anecdotesButtonHtml + previewButtonHtml;
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
          const MoreDetails = require('./models/models-chat/MoreDetails');
          const newDetail = new MoreDetails({
              bookTitle,
              author,
              detailedDescription: completeResponse // Save complete response here
          });
          if (checkFormatMoreDetails) {
            await newDetail.save();
          }
        }
        else if (isKeyInsights) {
          const KeyInsights = require('./models/models-chat/KeyInsights');
            const newDetail = new KeyInsights({
                bookTitle,
                author,
                keyInsights: completeResponse // Save complete response here
            });
            if (checkFormatKeyInsights) {
              await newDetail.save();
            }
        } else if (isAnecdotes) {
          const Anecdotes = require('./models/models-chat/Anecdotes');
            const newDetail = new Anecdotes({
                bookTitle,
                author,
                anecdotes: completeResponse // Save complete response here
            });
            if (checkFormatAnecdotes) {
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



