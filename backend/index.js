const mongoose = require('mongoose');
const openaiApi = require('./openaiApi');
const Session = require('./models/models-chat/Session');
const EmailRateLimit = require('./models/models-chat/EmailRateLimit');
const MoreDetails = require('./models/models-chat/MoreDetails');
const User = require('./models/models-chat/User');
const KeyInsightsModel = require('./models/models-chat/KeyInsights'); 
const AnecdotesModel = require('./models/models-chat/Anecdotes'); 
const QuotesModel = require('./models/models-chat/Quotes'); 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bookRecommendationPrompt = require('./prompts/promptBook');
const BookData = require('./models/models-chat/BookData'); 
const SearchHistory = require('./models/models-chat/SearchHistory'); 
const Comment = require('./models/models-chat/Comment'); 
const BookLike = require('./models/models-chat/BookLike'); 
const moreBooksRecommendationPrompt = require('./prompts/promptMoreBooks');
const moreDetailsPrompt = require('./prompts/promptMoreDetails');
const keyInsightsPrompt = require('./prompts/promptKeyInsights');
const anecdotesPrompt = require('./prompts/promptAnecdotes');
const quotesPrompt = require('./prompts/promptQuotes');
const passportSetup = require('./passport-setup'); // Import the setup function
const axios = require('axios');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); 
const redisClient = require('./redisClient'); 
 
require('dotenv').config();

const app = express();
app.set('trust proxy', 1)
const server = http.createServer(app);

const cors = require('cors');

const corsOptions = {
  origin: `${process.env.FRONTEND_URL}`, 
  credentials: true, 
};

app.use(cors(corsOptions));

const io = new Server(server, {
  cors: corsOptions, 
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
    sameSite: 'Lax', 
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
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

app.get('/api/check-auth', async (req, res) => {

  if (req.isAuthenticated()) {

    // Check if onboarding is complete based on the displayName being set
    if (req.user.displayName && req.user.country) {
      res.json({ isAuthenticated: true, onboardingComplete: true, user: req.user });
    } else {
      const newVerificationToken = jwt.sign(
        { email: req.user.local.email },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Update the existing user with the new verification token
      req.user.verificationToken = newVerificationToken;
      await req.user.save();
      
      const hasDisplayName = !!req.user.displayName;
      const hasCountry = !!req.user.country;

      res.json({
        isAuthenticated: true,
        onboardingComplete: false,
        user: req.user,
        displayName: req.user.displayName || null,
        verificationToken: newVerificationToken,
        hasDisplayName, 
        hasCountry
      });
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
      role: req.user.role,
      country: req.user.country
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
      console.log('Error revoking Google token:', err); 
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
    const hasCountry = user && user.country ? 'true' : 'false';
    const verificationUrl = `${process.env.FRONTEND_URL}/onboarding?token=${newVerificationToken}&hasDisplayName=${hasDisplayName}&hasCountry=${hasCountry}`;
      
    // Send verification email
    transporter.sendMail({
      from: '"GetBooks" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'GetBooks - Verify your email',
      html: `
        <div style="font-family: 'Arial', sans-serif; text-align: left; padding: 20px; max-width: 600px; margin: auto;">
          <h1 style="font-size: 26px;">Verify your email address</h1>
          <p style="font-size: 16px;">To continue setting up your GetBooks account, please verify that this is your email address.</p>
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
  const { token, displayName, country } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ 'local.email': decoded.email });

    if (!user) {
      return res.status(400).send('Invalid token');
    }

    if (displayName && country) {
      user.displayName = displayName;
      user.country = country;
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

const MESSAGE_LIMIT = process.env.MESSAGE_LIMIT;
const WINDOW_DURATION = 6 * 60 * 60 * 1000; // 3 hours in milliseconds

io.on('connection', (socket) => {
  console.log('A user connected');
  let currentSessionId;
  
  socket.on('query', async (data) => {
    const { sessionId, message, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, bookDataObjectId, bookTitle, author, moreBooks, isEdit } = data;
    currentSessionId = sessionId; 
  
    // Find the session and update it with the new message and response
    const session = await Session.findById(sessionId).populate('user');
    if (!session) {
      console.log('Session not found');
      return; 
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
          You have reached the message limit of 30 messages per 6 hours. Please try again after ${resetTimeString}.
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
      const errorMessage = `
      <div style="border:0.5px solid red; background-color:#fff0f0; padding:10px; margin:10px 0; border-radius:8px; color:#444444; font-size: 0.9rem">
        Input message is too large.
      </div>`;
    
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
        await openaiApi(messagesForGPT4, socket, session, currentSessionId, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, bookDataObjectId, bookTitle, author, moreBooks);
        await session.user.save();
      } catch (error) {
        console.error('Error processing query:', error);
        socket.emit('error', 'Error processing your request');
      }
    }
  }); 
  
  socket.on('book-detail', async (data) => {
    const { message, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, bookDataObjectId, bookTitle, author, userId } = data;  
    
    // Check message limit
    const now = new Date();

    const user = await User.findById(userId);

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
      const limitMessage = `
        <div style="border:1.3px solid red; background-color:#fff0f0; padding:10px; margin:10px 0; border-radius:8px; color:#444444; font-size: 0.9rem">
          You have reached the message limit of 30 messages per 6 hours. Please try again after ${resetTimeString}.
        </div>`;
    
      // Emit a warning message to the client and set the limitMessage as the session name
      socket.emit('chunk', { content: limitMessage, sessionId: null, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, moreBooks: null });
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
    } 
  
    const messagesForGPT4 = [{ role: 'user', content: completePrompt }];

    try {
      console.log("messagesForGPT4", messagesForGPT4);
      await openaiApi(messagesForGPT4, socket, null, null, isMoreDetails, isKeyInsights, isAnecdotes, isQuotes, bookDataObjectId, bookTitle, author, null);
      // await session.user.save();
    } catch (error) {
      console.error('Error processing query:', error);
      socket.emit('error', 'Error processing your request');
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
    const { bookDataObjectId, bookTitle } = req.query;
    let cacheKey = `more-details:${bookDataObjectId || bookTitle}`;

    // Try fetching the result from Redis first
    let cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    let query = {};
    if (bookDataObjectId) {
      // Ensure the bookDataObjectId is a valid ObjectId before querying
      if (!mongoose.Types.ObjectId.isValid(bookDataObjectId)) {
        return res.status(400).json({ message: 'Invalid bookDataObjectId provided' });
      }
      query.bookDataObjectId = bookDataObjectId; // Use the ObjectId directly without RegExp
    } else if (bookTitle) {
      query.bookTitle = new RegExp(bookTitle, 'i');
    } else {
      return res.status(400).json({ message: 'bookDataObjectId or book title must be provided' });
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
    const { bookDataObjectId, bookTitle } = req.query;
    let cacheKey = `key-insights:${bookDataObjectId || bookTitle}`;

    // Try fetching the result from Redis first
    let cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    let query = {};
    if (bookDataObjectId) {
      // Ensure the bookDataObjectId is a valid ObjectId before querying
      if (!mongoose.Types.ObjectId.isValid(bookDataObjectId)) {
        return res.status(400).json({ message: 'Invalid bookDataObjectId provided' });
      }
      query.bookDataObjectId = bookDataObjectId; // Use the ObjectId directly without RegExp
    } else if (bookTitle) {
      query.bookTitle = new RegExp(bookTitle, 'i');
    } else {
      return res.status(400).json({ message: 'bookDataObjectId or book title must be provided' });
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
    const { bookDataObjectId, bookTitle } = req.query;
    let cacheKey = `quotes:${bookDataObjectId || bookTitle}`;

    // Try fetching the result from Redis first
    let cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // If not in cache, continue with MongoDB query
    let query = {};
    if (bookDataObjectId) {
      // Ensure the bookDataObjectId is a valid ObjectId before querying
      if (!mongoose.Types.ObjectId.isValid(bookDataObjectId)) {
        return res.status(400).json({ message: 'Invalid bookDataObjectId provided' });
      }
      query.bookDataObjectId = bookDataObjectId; // Use the ObjectId directly without RegExp
    } else if (bookTitle) {
      query.bookTitle = new RegExp(bookTitle, 'i'); // Case-insensitive search for bookTitle is fine
    } else {
      return res.status(400).json({ message: 'bookDataObjectId or book title must be provided' });
    }

    const QuotesResult = await QuotesModel.findOne(query);
    if (!QuotesResult) {
      return res.status(404).json({ message: 'Quotes not found for this book' });
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
    const { bookDataObjectId, bookTitle } = req.query;
    let cacheKey = `anecdotes:${bookDataObjectId || bookTitle}`;

    // Try fetching the result from Redis first
    let cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // If not in cache, continue with MongoDB query
    let query = {};
    if (bookDataObjectId) {
      // Ensure the bookDataObjectId is a valid ObjectId before querying
      if (!mongoose.Types.ObjectId.isValid(bookDataObjectId)) {
        return res.status(400).json({ message: 'Invalid bookDataObjectId provided' });
      }
      query.bookDataObjectId = bookDataObjectId; // Use the ObjectId directly without RegExp
    } else if (bookTitle) {
      query.bookTitle = new RegExp(bookTitle, 'i');
    } else {
      return res.status(400).json({ message: 'bookDataObjectId or book title must be provided' });
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

// Book Details endpoints

const getPriorityGenres = async (userId) => {
  try {
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId format');
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const preferredGenres = await SearchHistory.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), timestamp: { $gte: twoWeeksAgo } } },
      { $addFields: { normalizedGenre: { $toLower: "$genre" } } },
      { $group: { _id: "$normalizedGenre", count: { $sum: 1 } } },
      { $match: { count: { $gte: 10 } } },
      { $sort: { count: -1 } }
    ]);

    const userPreferredGenres = preferredGenres.map(item => item._id).slice(0, 15);

    // Define a base priority order for genres
    const basePriorityGenres = ['self-help', 'personal development', 'business', 'psychology', 'biography', 'memoir'];
    const uniqueBasePriorityGenres = basePriorityGenres.filter(genre => !userPreferredGenres.includes(genre));

    // Combine userPreferredGenres with the filtered basePriorityGenres
    const priorityGenres = userPreferredGenres.concat(uniqueBasePriorityGenres);

    // Limit the final array to a maximum of 20 entries
    return priorityGenres.slice(0, 20);
  } catch (error) {
    console.error('Error fetching preferred genres:', error);
    throw error;
  }
};

function getNonPriorityGenres(genres, priorityGenres) {
  // Filter out non-priority genres and maintain their original order
  return genres.filter(genre => !priorityGenres.includes(genre.toLowerCase()));
}

async function getDistinctGenres(countryCode) {
  if (!countryCode) {
    throw new Error('Country code is required');
  }

  // Fetch genres where the specified country has a non-null book image
  const booksWithImages = await BookData.find({
    [`countrySpecific.${countryCode}.bookImage`]: { $ne: null }
  }).select('genres -_id').limit(60);

  // Flatten the array of genres arrays and normalize the case
  const genresNormalized = booksWithImages
    .flatMap(doc => doc.genres)
    .map(genre => genre.toLowerCase());

  // Get distinct genres and capitalize the first letter
  const distinctGenres = [...new Set(genresNormalized)]
    .map(genre => genre.charAt(0).toUpperCase() + genre.slice(1));

  // Ensure the final array does not exceed 20 entries
  return distinctGenres.slice(0, 10);
}

function sortGenres(genres, priorityGenres) {
  // Filter and sort only the priority genres
  const sortedPriorityGenres = genres.filter(genre => priorityGenres.includes(genre.toLowerCase()))
                                     .sort((a, b) => {
                                       let indexA = priorityGenres.indexOf(a.toLowerCase());
                                       let indexB = priorityGenres.indexOf(b.toLowerCase());
                                       return indexA - indexB;
                                     });

  // Filter out non-priority genres and maintain their original order
  const nonPriorityGenres = getNonPriorityGenres(genres, priorityGenres);

  // Concatenate the sorted priority genres with the original order non-priority genres
  return sortedPriorityGenres.concat(nonPriorityGenres);
}

// Genre feed creation logic:
// 1. To consider last 1 month time frame
// 2. Final order = preferred + non-preferred
// 3. No ordering for non-preferred
// 4. For preferred, we should order it by the number of entries in the history.
//     1. Minimum number of entries should be 10

app.post('/api/distinct-genres', async (req, res) => {
  const userId = req.body.userId;
  // console.log("userId is", userId); 
  const countryCode = req.body.country;

  try {
    const distinctGenres = await getDistinctGenres(countryCode);
    const priorityGenres = await getPriorityGenres(userId);
    const sortedGenres = sortGenres(distinctGenres, priorityGenres);

    res.json({
      message: 'Distinct genres retrieved and sorted successfully',
      genres: sortedGenres
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error occurred while retrieving distinct genres' });
  }
});

async function fetchAndProcessBooks(query, countryCode) {
  try {
    query[`countrySpecific.${countryCode}.bookImage`] = { $exists: true };
    const books = await BookData.find(query).limit(60);

    const imageSet = new Set();
    let allBooks = [];

    books.forEach(book => {
      const countryData = book.countrySpecific[countryCode];
      if (countryData && !imageSet.has(countryData.bookImage)) {
        imageSet.add(countryData.bookImage);
        const reviewCount = parseInt((countryData.amazonReviewCount || '0').replace(/,/g, ''), 10);
        const bookData = {
          _id: book._id,
          title: book.title,
          author: book.author,
          previewLink: book.previewLink,
          reviewCount: reviewCount,
          bookImage: countryData.bookImage,
          ...countryData
        };
        allBooks.push(bookData);
      }
    });

    allBooks.sort((a, b) => b.reviewCount - a.reviewCount);
    return allBooks;
  } catch (error) {
    console.error("Error processing books:", error);
    throw error; // Optionally rethrow to handle further up, or handle differently here
  }
}

// Feed creation logic for genre called 'All': 
// 1. To consider last 1 month time frame
// 2. To consider a genre as preferred genre only if it is searched at least 10 times in last 1 month
// 3. Arrange the preferred genres in the decreasing order of searches
// 4. For each genre, the corresponding books should be ordered in decreasing order of review count
// 5. Then in round robin fashion, starting from most preferred genre, we will start picking up the books
// 6. This way we will get preferred books
// 7. For non-preferred books, we will simply sort them by decreasing order of review count
// 8. Final order = preferred books followed by non-preferred books

app.post('/api/books', async (req, res) => {
  const { genre, countryCode, userId } = req.body;

  // console.log("Received genre:", genre);  // Log the received genre

  if (typeof genre !== 'string') {
    console.error('Genre is not a string:', genre);
    return res.status(400).json({ message: 'Genre must be a string' });
  }

  try {
    if (genre.toLowerCase() === 'all') {
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        const distinctGenres = await getDistinctGenres(countryCode);
        const priorityGenres = await getPriorityGenres(userId);
        const nonPriorityGenres = getNonPriorityGenres(distinctGenres, priorityGenres);
        // console.log("nonPriorityGenres is ", nonPriorityGenres);

        const imageSet = new Set();
        let booksByGenre = [];

        // Fetch books for each priority genre
        for (const genre of priorityGenres) {
          // console.log("Processing genre:", genre);
          const regexGenre = new RegExp(`^${genre}$`, 'i');
          const booksForGenre = await fetchAndProcessBooks({ genres: { $in: [regexGenre] } }, countryCode);
          booksByGenre.push(booksForGenre.filter(book => !imageSet.has(book.bookImage)).map(book => {
            imageSet.add(book.bookImage);
            return book;
          }));
        }

        // Apply round-robin distribution to priority books
        let allBooks = [];
        let maxBooks = Math.max(...booksByGenre.map(books => books.length));
        for (let i = 0; i < maxBooks; i++) {
          for (let books of booksByGenre) {
            if (i < books.length) {
              allBooks.push(books[i]);
            }
          }
        }

        // Fetch and deduplicate non-priority books
        const regexNonPriorityGenres = nonPriorityGenres.map(g => new RegExp(`^${g}$`, 'i'));
        const nonPriorityBooks = await fetchAndProcessBooks({ genres: { $in: regexNonPriorityGenres } }, countryCode);
        const filteredNonPriorityBooks = nonPriorityBooks.filter(book => !imageSet.has(book.bookImage));

        // Combine priority and non-priority books
        res.json([...allBooks, ...filteredNonPriorityBooks]);
      } else {
        res.json(await fetchAndProcessBooks({}, countryCode));
      }
    } else {
      // Split the genre string by commas, trim whitespace and use regex for case-insensitive matching
      const genres = genre.split(',').map(g => g.trim());
      const regexGenres = genres.map(g => new RegExp(`^${g}$`, 'i'));
      const booksWithCountryData = await fetchAndProcessBooks({ genres: { $in: regexGenres } }, countryCode, null, true);
      res.json(booksWithCountryData);
    }
  } catch (error) {
    console.error('Failed to fetch books:', error);
    res.status(500).json({ message: 'Error fetching books' });
  }
});

app.get('/api/books/:bookId/:country', async (req, res) => {
  const { bookId, country } = req.params;
  try {
    const book = await BookData.findById(bookId);
    if (!book) {
      return res.status(404).send('Book not found');
    }

    const baseResponse = {
      bookDataObjectId: book._id,
      title: book.title,
      author: book.author,
      previewLink: book.previewLink,
      genres: book.genres
    };

    if (country && book.countrySpecific && book.countrySpecific[country]) {
      const countryData = book.countrySpecific[country];
      const response = {
        ...baseResponse,
        countrySpecific: countryData
      };
      return res.json(response);
    }

    // If no country-specific data is found, return general book data with a note
    res.json({
      ...baseResponse,
      message: "No country-specific data available."
    });
  } catch (error) {
    res.status(500). send('Server error: ' + error.message);
  }
});

// Comments section:  

app.get('/api/comments', async (req, res) => {
  const { bookId } = req.query;
  try {
    // Fetch comments and sort them by creation date in descending order
    const comments = await Comment.find({ book: bookId })
      .populate('user', 'displayName')  // Populating user details for the comment
      .populate({
        path: 'replies',  // Specifying the path to populate
        options: { sort: { 'createdAt': -1 } },  // Sorting replies by createdAt in descending order
        populate: { path: 'user', select: 'displayName' }  // Nested population for user details in replies
      })
      .sort({ createdAt: -1 })  // Sorting comments by createdAt in descending order
      .exec();

    res.json(comments);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
}); 

app.get('/api/comments/preview', async (req, res) => {
  const { bookId } = req.query;
  try {
    // Count the number of comments associated with the bookId
    const count = await Comment.countDocuments({ book: bookId }).exec();
    
    // Find the most recent comment and populate the user's image
    const mostRecentComment = await Comment.findOne({ book: bookId })
      .populate('user', 'image')  // Populating the user's image
      .sort({ createdAt: -1 })  // Sorting by createdAt in descending order to get the most recent one
      .exec();

    // If there's a most recent comment, include its text and user's image in the response
    if (mostRecentComment) {
      res.json({
        count,
        mostRecentCommentText: mostRecentComment.text,
        mostRecentCommentUserImage: mostRecentComment.user.image
      });
    } else {
      res.json({ count });
    }
  } catch (error) {
    console.error('Failed to fetch comment count:', error);
    res.status(500).json({ message: 'Error fetching comment count' });
  }
});

app.post('/api/comments', async (req, res) => {
  const { text, bookId, userId } = req.body;
  try {
    const newComment = new Comment({
      text,
      book: bookId,
      user: userId,
      replies: [],
      likes: [],
      dislikes: []
    });

    await newComment.save();

    // After saving, populate the user field to get the displayName
    const populatedComment = await Comment.findById(newComment._id)
      .populate('user', 'displayName');  // Ensure that 'displayName' is the correct field you want to send back

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Failed to create comment:', error);
    res.status(500).json({ message: 'Error creating comment' });
  }
});

app.post('/api/comments/:commentId/replies', async (req, res) => {
  const { text, userId } = req.body;
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).send('Comment not found');
    }

    const reply = {
      text,
      user: userId,
      createdAt: new Date(),
      likes: [],
      dislikes: []
    };
    comment.replies.push(reply);
    await comment.save();

    // Repopulate the entire comment to update replies with user data
    const updatedComment = await Comment.findById(commentId)
      .populate('user', 'displayName')
      .populate({
        path: 'replies',
        populate: { path: 'user', select: 'displayName' }
      });

    res.status(201).json(updatedComment); // Send back the updated comment with populated replies
  } catch (error) {
    console.error('Failed to add reply:', error);
    res.status(500).json({ message: 'Failed to add reply' });
  }
});

// Like endpoint
app.patch('/api/comments/:commentId/like', async (req, res) => {
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Toggle like
    const likeIndex = comment.likes.indexOf(userId);
    if (likeIndex === -1) {
      // Remove from dislikes if exists
      const dislikeIndex = comment.dislikes.indexOf(userId);
      if (dislikeIndex !== -1) {
        comment.dislikes.splice(dislikeIndex, 1);
      }
      // Add to likes
      comment.likes.push(userId);
    } else {
      // Remove like if already exists
      comment.likes.splice(likeIndex, 1);
    }

    await comment.save();
    const updatedComment = await Comment.findById(req.params.commentId)
      .populate('user', 'displayName')
      .populate('replies.user', 'displayName');

    res.json(updatedComment);
  } catch (error) {
    console.error('Failed to like comment:', error);
    res.status(500).json({ message: 'Error updating like count' });
  }
});

// Dislike endpoint
app.patch('/api/comments/:commentId/dislike', async (req, res) => {
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Toggle dislike
    const dislikeIndex = comment.dislikes.indexOf(userId);
    if (dislikeIndex === -1) {
      // Remove from likes if exists
      const likeIndex = comment.likes.indexOf(userId);
      if (likeIndex !== -1) {
        comment.likes.splice(likeIndex, 1);
      }
      // Add to dislikes
      comment.dislikes.push(userId);
    } else {
      // Remove dislike if already exists
      comment.dislikes.splice(dislikeIndex, 1);
    }

    await comment.save();
    const updatedComment = await Comment.findById(req.params.commentId)
      .populate('user', 'displayName')
      .populate('replies.user', 'displayName');

    res.json(updatedComment);
  } catch (error) {
    console.error('Failed to dislike comment:', error);
    res.status(500).json({ message: 'Error updating dislike count' });
  }
});

// Like a reply and remove dislike if it exists
app.patch('/api/comments/replies/:replyId/like', async (req, res) => {
  const userId = req.body.userId;
  try {
    const comment = await Comment.findOne({"replies._id": req.params.replyId});
    const reply = comment.replies.id(req.params.replyId);
    const alreadyLiked = reply.likes.includes(userId);
    const currentlyDisliked = reply.dislikes.includes(userId);

    if (!alreadyLiked) {
      reply.likes.push(userId);
      if (currentlyDisliked) {
        reply.dislikes = reply.dislikes.filter(id => id.toString() !== userId.toString());
      }
    } else {
      reply.likes = reply.likes.filter(id => id.toString() !== userId.toString());
    }

    await comment.save();
    res.json(reply);
  } catch (error) {
    console.error('Failed to like reply:', error);
    res.status(500).json({ message: 'Error updating like count for reply' });
  }
});

// Dislike a reply and remove like if it exists
app.patch('/api/comments/replies/:replyId/dislike', async (req, res) => {
  const userId = req.body.userId;
  try {
    const comment = await Comment.findOne({"replies._id": req.params.replyId});
    const reply = comment.replies.id(req.params.replyId);
    const alreadyDisliked = reply.dislikes.includes(userId);
    const currentlyLiked = reply.likes.includes(userId);

    if (!alreadyDisliked) {
      reply.dislikes.push(userId);
      if (currentlyLiked) {
        reply.likes = reply.likes.filter(id => id.toString() !== userId.toString());
      }
    } else {
      reply.dislikes = reply.dislikes.filter(id => id.toString() !== userId.toString());
    }

    await comment.save();
    res.json(reply);
  } catch (error) {
    console.error('Failed to dislike reply:', error);
    res.status(500).json({ message: 'Error updating dislike count for reply' });
  }
});

// like dislike specific to main-book
app.post('/api/books/:bookId/like', async (req, res) => {
  const { userId, like } = req.body;
  const { bookId } = req.params;

  if (!userId) {
      return res.status(400).json({ message: "User ID must be provided" });
  }

  try {
      if (like === null) {
          // Directly delete the document without fetching
          await BookLike.deleteOne({ user: userId, book: bookId });
      } else {
          const existingLike = await BookLike.findOne({ user: userId, book: bookId });
          if (existingLike) {
              existingLike.like = like;
              await existingLike.save();
          } else {
              // Create a new document if it does not exist and like is not null
              const newLike = new BookLike({ user: userId, book: bookId, like });
              await newLike.save();
          }
      }
      res.json({ message: 'Your preference has been recorded' });
  } catch (error) {
      console.error('Error updating like/dislike status:', error);
      res.status(500).json({ message: 'Error processing your request', details: error.message });
  }
});


// In your frontend fetching logic, adjust how userLiked and userDisliked are calculated
app.post('/api/books/:bookId/likes-dislikes', async (req, res) => {
  const { userId } = req.body;
  const { bookId } = req.params;

  try {
      const likesCount = await BookLike.countDocuments({ book: bookId, like: true });
      const dislikesCount = await BookLike.countDocuments({ book: bookId, like: false });
      const userLike = userId ? await BookLike.findOne({ book: bookId, user: userId }) : null;

      const userLiked = userLike ? userLike.like === true : false;
      const userDisliked = userLike ? userLike.like === false : false;

      res.json({
          likes: likesCount,
          dislikes: dislikesCount,
          userLiked,
          userDisliked
      }); 
  } catch (error) {
      console.error('Failed to fetch likes/dislikes:', error);
      res.status(500).json({ message: 'Error fetching likes/dislikes' });
  }
});

app.post('/api/saveSearchHistory', async (req, res) => {
  const { userId, bookId } = req.body;

  try {
    // Find the user and book data
    const user = await User.findById(userId);
    const book = await BookData.findById(bookId);

    if (!user || !book) {
      return res.status(404).send('User or Book not found');
    }

    // Create a new SearchHistory document for each genre from the book
    const promises = book.genres.map(genre => {
      return new SearchHistory({
        user: userId,
        userName: user.displayName,
        bookTitle: book.title,
        genre: genre,
        timestamp: new Date() // Adds the current timestamp
      }).save();
    });

    // Wait for all SearchHistory documents to be saved
    await Promise.all(promises);

    res.status(200).send('Search history updated successfully');
  } catch (error) {
    console.error('Error updating search history:', error);
    res.status(500).send('Internal server error');
  }
});

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

if (process.env.NODE_ENV === 'local') {
  app.get('/api/update-genres', async (req, res) => {
    try {
      // Fetch books without genres
      const booksToUpdate = await BookData.find({ genres: { $exists: false } });

      let updateCount = 0;
      
      for (const book of booksToUpdate) {
        // Use the title and author to fetch genres
        const genres = await openaiApi.getGenres(book.title, book.author);

        // Update the book document with new genres
        const result = await BookData.updateOne(
          { _id: book._id },
          { $set: { genres: genres } }
        );

        if (result.nModified > 0) updateCount++;
      }

      res.json({
        message: 'Updated records successfully',
        updatedCount: updateCount
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error occurred while updating the records' });
    }
  });
}

if (process.env.NODE_ENV === 'local') {
  app.get('/api/populate-genres', async (req, res) => {
    try {
      // Fetch all books that need their genres populated
      const booksToUpdate = await BookData.find({ genres: { $exists: false } });

      let updateCount = 0;
      
      for (const book of booksToUpdate) {
        // Use the title and author to fetch genres
        const genres = await openaiApi.getGenres(book.title, book.author);

        // Ensure that genres is an array before updating the book document
        if (Array.isArray(genres)) {
          // Update the book document with new genres
          const result = await BookData.updateOne(
            { _id: book._id },
            { $set: { genres: genres } }
          );

          if (result.nModified > 0) updateCount++;
        }
      }

      res.json({
        message: 'Genres repopulated successfully',
        updatedCount: updateCount
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error occurred while repopulating genres' });
    }
  });
}



if (process.env.NODE_ENV === 'local') {
  app.get('/api/fix-genres-format', async (req, res) => {
    try {
      // Fetch books with genres formatted as nested arrays
      const booksToUpdate = await BookData.find({ 'genres.0': { $exists: true } });

      let updateCount = 0;
      
      for (const book of booksToUpdate) {
        // Check if the genres field is an array and the first element is also an array
        if (Array.isArray(book.genres) && book.genres.length > 0 && Array.isArray(book.genres[0])) {
          // Assuming the nested array at the first index of genres is the correct array
          const correctedGenres = book.genres[0];

          // Update the book document with the corrected genres
          const result = await BookData.updateOne(
            { _id: book._id },
            { $set: { genres: correctedGenres } }
          );

          if (result.nModified > 0) updateCount++;
        }
      }

      res.json({
        message: 'Updated genres format successfully',
        updatedCount: updateCount
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error occurred while updating the genres format' });
    }
  });
}

if (process.env.NODE_ENV === 'local') {
  app.get('/api/delete-genres', async (req, res) => {
    try {
      // Unset the genres field for all documents in the collection
      const result = await BookData.updateMany(
        {}, // empty filter means "match all documents"
        { $unset: { genres: "" } } // remove the genres field from all documents
      );
  
      res.json({
        message: 'Genres field removed from all documents',
        affectedCount: result.nModified
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error occurred while deleting genres field' });
    }
  });
}






