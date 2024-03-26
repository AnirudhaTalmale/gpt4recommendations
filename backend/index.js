const mongoose = require('mongoose');
const openaiApi = require('./openaiApi');
const Session = require('./models/models-chat/Session');
const EmailRateLimit = require('./models/models-chat/EmailRateLimit');
const MoreDetails = require('./models/models-chat/MoreDetails');
const User = require('./models/models-chat/User');
const KeyInsightsModel = require('./models/models-chat/KeyInsights'); 
const AnecdotesModel = require('./models/models-chat/Anecdotes'); 
const QuotesModel = require('./models/models-chat/Quotes'); 
const BookData = require('./models/models-chat/BookData'); 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bookRecommendationPrompt = require('./prompts/promptBook');
const moreBooksRecommendationPrompt = require('./prompts/promptMoreBooks');
const moreDetailsPrompt = require('./prompts/promptMoreDetails');
const keyInsightsPrompt = require('./prompts/promptKeyInsights');
const anecdotesPrompt = require('./prompts/promptAnecdotes');
const quotesPrompt = require('./prompts/promptQuotes');
const passportSetup = require('./passport-setup'); // Import the setup function
const axios = require('axios');
const multer = require('multer');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); 
const redisClient = require('./redisClient'); 
 
require('dotenv').config();

const app = express();
app.set('trust proxy', 1)
const server = http.createServer(app);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const cors = require('cors');

// Update CORS configuration to allow specific origin and credentials
const corsOptions = {
  origin: `${process.env.FRONTEND_URL}`, // Your frontend's URL
  credentials: true, // Enable credentials
};

app.use(cors(corsOptions)); // Apply updated CORS options

const io = new Server(server, {
  cors: corsOptions, // Use the same CORS options for Socket.io
  maxHttpBufferSize: 1e8 // sets the limit to 100 MB
});
 

// For JSON payloads
app.use(express.json({ limit: '50mb' }));

// For URL-encoded payloads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const session = require('express-session');
const MongoStore = require('connect-mongo');

const sessionConfig = {
  secret: 'your_secret_key', // Replace with a secret key of your choice
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI_GET_BOOKS_AI,
    collectionName: 'auth_sessions'
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? 'None' : 'Lax',
    httpOnly: false,
  }
}; 

// Use the session middleware
app.use(session(sessionConfig));


passportSetup(app); // Set up passport with the app

mongoose.connect(process.env.MONGO_URI_GET_BOOKS_AI) 
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  } 
}); 

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// Authentication Code: 

app.get('/api/check-auth', (req, res) => {

  if (req.isAuthenticated()) {

    // Check if onboarding is complete based on the displayName being set
    if (req.user.displayName) {
      res.json({ isAuthenticated: true, onboardingComplete: true, user: req.user });
    } else {
      res.json({ isAuthenticated: true, onboardingComplete: false, user: req.user });
    }
  } else {
    console.log('User is not authenticated');
    res.json({ isAuthenticated: false });
  }
}); 

app.get('/api/user-info', (req, res) => {

  if (req.isAuthenticated()) {

    let email = req.user.local && req.user.local.email ? req.user.local.email : '';

    let image = req.user.image;
    if (!image) {
      image = getDefaultImage(req.user.displayName);
    }

    const userInfo = {
      id: req.user._id,
      name: req.user.displayName,
      email: email,
      image: image,
      role: req.user.role
    };

    res.json({
      isAuthenticated: true,
      user: userInfo
    });
  } else {
    console.log('User is not authenticated');
    res.status(401).json({ isAuthenticated: false });
  }
});


app.get('/auth/logout', (req, res, next) => {
  const accessToken = req.user.accessToken; // Retrieve the stored access token
  req.logout(function(err) {
    if (err) { return next(err); }

    // Revoke the Google access token
    axios.post('https://accounts.google.com/o/oauth2/revoke', {
      token: accessToken,
    }).then(() => {
      console.log('Google token revoked');
    }).catch(err => {
    });

    req.session.destroy(function(err) {
      if (err) { return next(err); }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

// Email Verification code and Onboarding code: 

app.post('/send-verification-email', async (req, res) => {
  const { email } = req.body;

  try {
    const rateLimit = await EmailRateLimit.findOne({ email });

    if (rateLimit) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      if (rateLimit.lastSent > oneHourAgo) {
        if (rateLimit.count >= 8) {
          const resetTime = new Date(rateLimit.lastSent.getTime() + 60 * 60 * 1000); // 1 hour after the last sent email
          return res.status(429).json({ 
            message: 'Rate limit exceeded.', 
            resetTime: resetTime.toISOString() // Send the reset time in ISO format
          });
        }
        rateLimit.count++;
      } else {
        rateLimit.count = 1; // Reset the count if it's been more than an hour
      }
      rateLimit.lastSent = new Date(); // Update lastSent time
      await rateLimit.save();
    } else {
      // If no rate limit record exists, create one
      await new EmailRateLimit({ email, count: 1, lastSent: new Date() }).save();
    }

    let user = await User.findOne({ 'local.email': email });

    const newVerificationToken = jwt.sign(
        { email: email },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const hasDisplayName = user && user.displayName ? 'true' : 'false';
    const verificationUrl = `${process.env.FRONTEND_URL}/onboarding?token=${newVerificationToken}&hasDisplayName=${hasDisplayName}`;
      
    // Send verification email
    transporter.sendMail({
      from: '"GetBooksAI" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'GetBooksAI - Verify your email',
      html: `
        <div style="font-family: 'Arial', sans-serif; text-align: left; padding: 20px; max-width: 600px; margin: auto;">
          <h1 style="font-size: 26px;">Verify your email address</h1>
          <p style="font-size: 16px;">To continue setting up your GetBooksAI account, please verify that this is your email address.</p>
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 8px 18px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">Verify email address</a>
          <p style="color: #666666; margin-top: 28px; font-size: 12px;">This link will expire in 15 minutes. If you did not make this request, please disregard this email.</p>
        </div>
      `
    });

    if (user) {
      user.verificationToken = newVerificationToken;
      await user.save();
    } else {
        user = new User({
            local: { email: email },
            verificationToken: newVerificationToken
        });
        await user.save();
    }

    // Respond that the email is sent
    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Error in sending email:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/onboarding', async (req, res) => {
  const { token, displayName } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ 'local.email': decoded.email });

    if (!user) {
      return res.status(400).send('Invalid token');
    }

    if (displayName) {
      user.displayName = displayName;
      if (!user.image) {
          user.image = getDefaultImage(displayName);
      }
    }

    user.verificationToken = null;
    await user.save();

    req.login(user, (err) => {
      if (err) { 
          return res.status(500).send('Error logging in'); 
      }
      res.json({ success: true, redirectTo: '/chat' });
    });
  } catch (err) {
    console.error('Error in onboarding:', err);
    res.status(400).send('Invalid or expired token');
  }
}); 

const getDefaultImage = (displayName) => {
  if (!displayName || displayName.length === 0) return '';

  const firstLetter = displayName.charAt(0).toUpperCase();
  // Updated color array with shades of grey
  const colors = ['#A0A0A0', '#808080', '#606060', '#404040']; // Example of grey color array
  const bgColor = colors[Math.floor(Math.random() * colors.length)]; // Randomly select a background color

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                <circle cx="50" cy="50" r="50" fill="${bgColor}" />
                <text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="white" font-family="Arial" font-size="50">${firstLetter}</text>
               </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

function estimateTokenCount(text) {
  // Rough estimate of token count for a given text
  return text.trim().split(/\s+/).length;
}

const MESSAGE_LIMIT = 100; // Set your desired message limit
const WINDOW_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

io.on('connection', (socket) => {
  console.log('A user connected');
  let currentSessionId;
  
  socket.on('query', async (data) => {
    const { sessionId, message, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, isbn, bookTitle, author, moreBooks, isEdit } = data;
    currentSessionId = sessionId; 
  
    // Find the session and update it with the new message and response
    const session = await Session.findById(sessionId).populate('user');
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });  
    }

    if (!isMoreDetails && !moreBooks && !isKeyInsights && !isAnecdotes && !isQuotes && !isEdit) {
      // Add the user message to the session
      const newMessage = {
        role: 'user', 
        contentType: 'simple',
        content: message.content
      };
      session.messages.push(newMessage);

      // Save the session 
      await session.save();

      // The newly added message will be the last in the array
      const savedMessage = session.messages[session.messages.length - 1];

      // Emit the saved message back to the client
      socket.emit('messageSaved', { sessionId, savedMessage });
    }

    // Check message limit
    const now = new Date();

    if (session.user.firstMessageTimestamp === undefined || session.user.messageCount === undefined) {
      session.user.firstMessageTimestamp = now;
      session.user.messageCount = 0;
    }

    if (!session.user.firstMessageTimestamp || now - session.user.firstMessageTimestamp.getTime() > WINDOW_DURATION) {
      // Reset if more than 3 hours have passed
      session.user.firstMessageTimestamp = now;
      session.user.messageCount = 1;
    } else {
      // Increment message count
      session.user.messageCount += 1;
    }

    if (session.user.messageCount > MESSAGE_LIMIT) {
      const timePassed = now - session.user.firstMessageTimestamp.getTime();
      const timeRemaining = WINDOW_DURATION - timePassed;
      const resetTime = new Date(now.getTime() + timeRemaining);
    
      // Formatting the reset time in HH:MM format
      const resetTimeString = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const limitMessage = `
        <div style="border:1.3px solid red; background-color:#fff0f0; padding:10px; margin:10px 0; border-radius:8px; color:#444444; font-size: 0.9rem">
          You have reached the message limit. Try again after ${resetTimeString}.
        </div>`;
    
      // Emit a warning message to the client and set the limitMessage as the session name
      socket.emit('messageLimitReached', { content: limitMessage, sessionId: currentSessionId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes });
    
      if(!isMoreDetails && message.isFirstQuery && !isKeyInsights && !isAnecdotes && !isQuotes) {
        // Update the session name with the limitMessage and save the session
        const newSessionName = 'Message limit reached';
        session.sessionName = newSessionName;
        await session.save();
        socket.emit('updateSessionName', { sessionId: session._id, sessionName: newSessionName });
      }
      return;
    }    

    let completePrompt;
    if (isMoreDetails || message.content.startsWith("Explain the book - ")) {
      completePrompt = moreDetailsPrompt(message.content);
    } else if (isKeyInsights) {
      completePrompt = keyInsightsPrompt(message.content);
    } else if (isAnecdotes) {
      completePrompt = anecdotesPrompt(message.content);
    } else if (isQuotes) {
      completePrompt = quotesPrompt(message.content);
    } else if (moreBooks) {
      completePrompt = moreBooksRecommendationPrompt(message.content);
    } else {
      completePrompt = bookRecommendationPrompt(message.content);
    }

    const currentMessageTokenCount = estimateTokenCount(completePrompt);
    const currentMessageTokenThreshold = 400; 

    if (currentMessageTokenCount > currentMessageTokenThreshold) {
      const errorMessage = 'Input message too large';
    
      // Emit a warning message to the client and update session name if it's the first query
      socket.emit('chunk', { content: errorMessage, sessionId: currentSessionId, isMoreDetails, isKeyInsights });
    
      if (message.isFirstQuery) {
        session.sessionName = errorMessage;
        await session.save();
        socket.emit('updateSessionName', { sessionId: session._id, sessionName: errorMessage });
      }
    }    
    else {

      if (message.isFirstQuery && !isMoreDetails && !isKeyInsights && !isAnecdotes && !isQuotes && !moreBooks) {
        // Get the 4-word summary
        const summary = await openaiApi.getSummary(message.content);
        session.sessionName = summary; // Update the session name with the summary
        await session.save(); // Don't forget to save the updated session
        socket.emit('updateSessionName', { sessionId: session._id, sessionName: summary });
      }
    
      const messagesForGPT4 = [{ role: 'user', content: completePrompt }];

      try {
        console.log("messagesForGPT4", messagesForGPT4);
        await openaiApi(messagesForGPT4, socket, session, currentSessionId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, isbn, bookTitle, author, moreBooks);
        await session.user.save();
      } catch (error) {
        console.error('Error processing query:', error);
        socket.emit('error', 'Error processing your request');
      }
    }
  });   

  socket.on('specific-book-query', async (data) => {
    const { userId, message, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, isbn, bookTitle, author, moreBooks } = data;

    // Check message limit
    const now = new Date();

    let user = await User.findById(userId);

    if (user.firstMessageTimestamp === undefined || user.messageCount === undefined) {
      user.firstMessageTimestamp = now;
      user.messageCount = 0;
    }

    if (!user.firstMessageTimestamp || now - user.firstMessageTimestamp.getTime() > WINDOW_DURATION) {
      // Reset if more than 3 hours have passed
      user.firstMessageTimestamp = now;
      user.messageCount = 1;
    } else {
      // Increment message count
      user.messageCount += 1;
    }

    if (user.messageCount > MESSAGE_LIMIT) {
      const timePassed = now - user.firstMessageTimestamp.getTime();
      const timeRemaining = WINDOW_DURATION - timePassed;
      const resetTime = new Date(now.getTime() + timeRemaining);
    
      // Formatting the reset time in HH:MM format
      const resetTimeString = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const limitMessage = `You have reached the message limit. Try again after ${resetTimeString}.`;
    
      // Emit a warning message to the client and set the limitMessage as the session name
      socket.emit('messageLimitReached', { userId, limitMessage });
      return;
    }   

    let completePrompt;
    if (isMoreDetails || message.content.startsWith("Explain the book - ")) {
      completePrompt = moreDetailsPrompt(message.content);
    } else if (isKeyInsights) {
      completePrompt = keyInsightsPrompt(message.content);
    } else if (isAnecdotes) {
      completePrompt = anecdotesPrompt(message.content);
    } else if (isQuotes) {
      completePrompt = quotesPrompt(message.content);
    } else if (moreBooks) {
      completePrompt = moreBooksRecommendationPrompt(message.content);
    } else {
      completePrompt = bookRecommendationPrompt(message.content);
    }

    const messagesForGPT4 = [{ role: 'user', content: completePrompt }];

    try {
      console.log("messagesForGPT4", messagesForGPT4);
      await openaiApi(messagesForGPT4, socket, session, userId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, isbn, bookTitle, author, moreBooks);
      await user.save();
    } catch (error) {
      console.log('Error processing query:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// ------------------- chat endpoints-------------------

app.post('/api/stop-stream', (req, res) => {
  try {
    openaiApi.stopStream();
    res.json({ message: 'Stream stopped successfully' });
  } catch (error) {
    console.error('Error stopping the stream:', error);
    res.status(500).json({ message: 'Error stopping the stream', error: error.toString() });
  }
});

app.get('/api/more-details', async (req, res) => {
  try {
    const { isbn, bookTitle } = req.query;
    let cacheKey = `more-details:${isbn || bookTitle}`;

    // Try fetching the result from Redis first
    let cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    let query = {};
    if (isbn) {
      query.isbn = new RegExp(isbn, 'i');
    } else if (bookTitle) {
      query.bookTitle = new RegExp(bookTitle, 'i');
    } else {
      return res.status(400).json({ message: 'ISBN or book title must be provided' });
    }

    const bookDetails = await MoreDetails.findOne(query);
    if (!bookDetails) {
      return res.status(404).json({ message: 'Details not found for this book' });
    }

    // Save the result in Redis without an expiration time
    await redisClient.set(cacheKey, JSON.stringify(bookDetails));

    res.json(bookDetails);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error occurred while fetching book details' });
  }
});

app.get('/api/key-insights', async (req, res) => {
  try {
    const { isbn, bookTitle } = req.query;
    let cacheKey = `key-insights:${isbn || bookTitle}`;

    // Try fetching the result from Redis first
    let cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    let query = {};
    if (isbn) {
      query.isbn = new RegExp(isbn, 'i');
    } else if (bookTitle) {
      query.bookTitle = new RegExp(bookTitle, 'i');
    } else {
      return res.status(400).json({ message: 'ISBN or book title must be provided' });
    }

    const keyInsightsResult = await KeyInsightsModel.findOne(query);
    if (!keyInsightsResult) {
      return res.status(404).json({ message: 'Key Insights not found for this book' });
    }

    // Save the result in Redis without an expiration time
    await redisClient.set(cacheKey, JSON.stringify(keyInsightsResult));

    res.json(keyInsightsResult);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error occurred while fetching book details' });
  } 
});

app.get('/api/quotes', async (req, res) => {
  try {
    const { isbn, bookTitle } = req.query;
    let cacheKey = `quotes:${isbn || bookTitle}`;

    // Try fetching the result from Redis first
    let cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // If not in cache, continue with MongoDB query
    let query = {};
    if (isbn) {
      query.isbn = new RegExp(isbn, 'i');
    } else if (bookTitle) {
      query.bookTitle = new RegExp(bookTitle, 'i');
    } else {
      return res.status(400).json({ message: 'ISBN or book title must be provided' });
    }

    const QuotesResult = await QuotesModel.findOne(query);
    if (!QuotesResult) {
      return res.status(404).json({ message: 'Key Insights not found for this book' });
    }

    // Save the result in Redis without an expiration time
    await redisClient.set(cacheKey, JSON.stringify(QuotesResult));

    res.json(QuotesResult);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error occurred while fetching book details' });
  }
});

app.get('/api/anecdotes', async (req, res) => {
  try {
    const { isbn, bookTitle } = req.query;
    let cacheKey = `anecdotes:${isbn || bookTitle}`;

    // Try fetching the result from Redis first
    let cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // If not in cache, continue with MongoDB query
    let query = {};
    if (isbn) {
      query.isbn = new RegExp(isbn, 'i');
    } else if (bookTitle) {
      query.bookTitle = new RegExp(bookTitle, 'i');
    } else {
      return res.status(400).json({ message: 'ISBN or book title must be provided' });
    }

    const AnecdotesResult = await AnecdotesModel.findOne(query);
    if (!AnecdotesResult) {
      return res.status(404).json({ message: 'Key Insights not found for this book' });
    }

    // Save the result in Redis without an expiration time
    await redisClient.set(cacheKey, JSON.stringify(AnecdotesResult));

    res.json(AnecdotesResult);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error occurred while fetching book details' });
  }
});

app.post('/api/session', async (req, res) => {
  try {
    const userId = req.body.userId; // Get user ID from the request body
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    } 

    const newSession = new Session({ user: userId, messages: [] });
    await newSession.save();

    res.json(newSession);
  } catch (error) {
    console.error('POST /api/session - Error:', error);
    res.status(500).json({ message: 'Error creating a new session', error: error.toString() });
  } 
});

// GET endpoint for retrieving all sessions with their messages
app.get('/api/sessions', async (req, res) => {
  try {
    const userId = req.query.userId; // Get user ID from query parameter
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const sessions = await Session.find({ user: userId });
    res.json(sessions);
  } catch (error) {
    console.error('GET /api/sessions - Error:', error);
    res.status(500).json({ message: 'Error retrieving sessions', error: error.toString() });
  }
});

// DELETE endpoint for deleting a session
app.delete('/api/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try { 
    const session = await Session.findByIdAndDelete(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    } 
    res.status(200).json({ message: 'Session deleted' });
  } catch (error) {
    console.error('DELETE /api/session/:sessionId - Error:', error);
    res.status(500).json({ message: 'Error deleting the session', error: error.toString() });
  }
});

app.delete('/api/user/delete', async (req, res) => {
  try {
    // Authentication check (this is just a placeholder, implement your actual authentication logic)
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user._id; // Assuming you have the user's ID stored in req.user

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Here, you can add additional cleanup logic if necessary

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/user/delete - Error:', error);
    res.status(500).json({ message: 'Error deleting the account', error: error.toString() });
  }
});

app.post('/api/session/:sessionId/edit-message/:messageId', async (req, res) => {
  const { sessionId, messageId } = req.params;
  const { newContent } = req.body;

  try {
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const messageIndex = session.messages.findIndex(message => message._id.toString() === messageId);
    if (messageIndex === -1) return res.status(404).json({ message: 'Message not found' });

    // Update the content of the edited message
    session.messages[messageIndex].content = newContent;

    // Remove all subsequent messages
    session.messages = session.messages.slice(0, messageIndex + 1);

    await session.save();
    res.json({ message: 'Message updated and subsequent messages removed' });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ message: 'Error updating the message', error: error.toString() });
  }
});

// Book Gallery Endpoints

// app.get('/api/books', async (req, res) => {
//   // Construct a unique cache key based on query parameters
//   let cacheKey = 'books-list';
//   if (req.query.genre && req.query.genre !== 'All') {
//     cacheKey += `:genre=${req.query.genre}`;
//   }
//   if (req.query.search) {
//     cacheKey += `:search=${req.query.search}`;
//   }

//   try {
//     // Try fetching the books list from Redis first
//     let cachedData = await redisClient.get(cacheKey);
//     if (cachedData) {
//       return res.json(JSON.parse(cachedData));
//     }

//     // Construct the query object based on request parameters
//     const query = {};
//     if (req.query.genre && req.query.genre !== 'All') {
//       query.genres = req.query.genre;
//     }
//     if (req.query.search) {
//       query.$or = [
//         { title: { $regex: req.query.search, $options: 'i' } },
//         { author: { $regex: req.query.search, $options: 'i' } },
//         { genres: { $regex: req.query.search, $options: 'i' } },
//       ];
//     }

//     // Fetch from the database if not found in cache
//     const books = await BookData.find(query).lean();

//     // Save the fetched books list in Redis with a TTL of 6 hours (21600 seconds)
//     await redisClient.set(cacheKey, JSON.stringify(books), 'EX', 21600);

//     // Return the books list
//     res.json(books);
//   } catch (error) {
//     console.error('GET /api/books - Server error:', error);
//     res.status(500).json({ message: 'Server error occurred while fetching books', error: error.toString() });
//   }
// });


// app.get('/api/genres', async (req, res) => {
//   try {
//     const cacheKey = 'genres-list';

//     // Try fetching the genres list from Redis first
//     let cachedData = await redisClient.get(cacheKey);
//     if (cachedData) {
//       return res.json(JSON.parse(cachedData));
//     }

//     // If not found in cache, fetch from the database
//     const genreCounts = await BookData.aggregate([
//       { $unwind: '$genres' },
//       { $group: { _id: '$genres', count: { $sum: 1 } } },
//       { $sort: { count: -1 } }
//     ]);

//     // Save the fetched genres list in Redis with a TTL of 6 hours (21600 seconds)
//     await redisClient.set(cacheKey, JSON.stringify(genreCounts.map(g => g._id)), 'EX', 21600);

//     // Return the genres list
//     res.json(genreCounts.map(g => g._id));
//   } catch (error) {
//     console.error('GET /api/genres - Server error:', error);
//     res.status(500).json({ message: 'Server error occurred while fetching genres', error: error.toString() });
//   }
// });


// // Book Detail Endpoints

// app.get('/api/books/:bookId', async (req, res) => {
//   try {
//     const bookId = req.params.bookId;
//     let cacheKey = `book-details:${bookId}`;

//     // Try fetching the book details from Redis first
//     let cachedData = await redisClient.get(cacheKey);
//     if (cachedData) {
//       return res.json(JSON.parse(cachedData));
//     }

//     // If not found in cache, fetch from the database
//     const book = await BookData.findOne({ _id: bookId }).lean();
//     if (!book) {
//       return res.status(404).json({ message: 'Book not found' });
//     }

//     // Save the fetched book details in Redis without an expiration time
//     // You might choose to set an expiration time depending on your requirements
//     await redisClient.set(cacheKey, JSON.stringify(book));

//     // Return the book details
//     res.json(book);
//   } catch (error) {
//     console.error('GET /api/books/:bookId - Server error:', error);
//     res.status(500).json({ message: 'Server error occurred while fetching book details', error: error.toString() });
//   }
// });


 
// development routes: 

if (process.env.NODE_ENV === 'local') {
  app.get('/api/redis-data', async (req, res) => {
    try {
      // Fetch all keys
      const keys = await redisClient.keys('*');
      let data = {};

      // Fetch values for each key
      for (const key of keys) {
        const value = await redisClient.get(key);
        data[key] = JSON.parse(value);
      }

      res.json(data);
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error occurred while fetching Redis data' });
    }
  });
}


if (process.env.NODE_ENV === 'local') {
  app.get('/api/clear-redis-data', async (req, res) => {
    try {
      // Fetch all keys
      const keys = await redisClient.keys('*');

      // Delete all keys
      for (const key of keys) {
        await redisClient.del(key);
      }

      res.json({ message: 'All cache data has been deleted' });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error occurred while deleting Redis data' });
    }
  });
}

