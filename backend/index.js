const mongoose = require('mongoose');
const openaiApi = require('./openaiApi');
const Session = require('./models/models-chat/Session');
const EmailRateLimit = require('./models/models-chat/EmailRateLimit');
const MoreDetails = require('./models/models-chat/MoreDetails');
const User = require('./models/models-chat/User');
const KeyInsightsModel = require('./models/models-chat/KeyInsights'); 
const AnecdotesModel = require('./models/models-chat/Anecdotes'); 
const QuotesModel = require('./models/models-chat/Quotes'); 
const BookAction = require('./models/models-chat/BookAction');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bookRecommendationPrompt = require('./prompts/promptBook');
const BookData = require('./models/models-chat/BookData'); 
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
const WINDOW_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

// Function to convert milliseconds to hours
function durationInHours(ms) {
  return ms / (60 * 60 * 1000); // Converts milliseconds to hours
}

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

    if (session.user.totalMessageCount === undefined) {
      session.user.totalMessageCount = 0;
    }

    if (!session.user.firstMessageTimestamp || now - session.user.firstMessageTimestamp.getTime() > WINDOW_DURATION) {
      // Reset if more than 3 hours have passed
      session.user.firstMessageTimestamp = now;
      session.user.messageCount = 1;
    } else {
      // Increment message count
      session.user.messageCount += 1;
    }

    session.user.totalMessageCount += 1;

    if (session.user.messageCount > MESSAGE_LIMIT) {
      const timePassed = now - session.user.firstMessageTimestamp.getTime();
      const timeRemaining = WINDOW_DURATION - timePassed;
      const resetTime = new Date(now.getTime() + timeRemaining);
    
      // Formatting the reset time in HH:MM format
      const resetTimeString = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const limitMessage = `
        <div style="border:1.3px solid red; background-color:#fff0f0; padding:10px; margin:10px 0; border-radius:8px; color:#444444; font-size: 0.9rem">
        You have reached the message limit of ${MESSAGE_LIMIT} messages per ${durationInHours(WINDOW_DURATION)} hours. Please try again after ${resetTimeString}.
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
        socket.emit('query-conversionTracking');
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

    if (user.totalMessageCount === undefined) {
      user.totalMessageCount = 0;
    }

    if (!user.firstMessageTimestamp || now - user.firstMessageTimestamp.getTime() > WINDOW_DURATION) {
      // Reset if more than 3 hours have passed
      user.firstMessageTimestamp = now;
      user.messageCount = 1;
    } else {
      // Increment message count
      user.messageCount += 1;
    }

    user.totalMessageCount += 1;

    if (user.messageCount > MESSAGE_LIMIT) {
      const timePassed = now - user.firstMessageTimestamp.getTime();
      const timeRemaining = WINDOW_DURATION - timePassed;
      const resetTime = new Date(now.getTime() + timeRemaining);
    
      // Formatting the reset time in HH:MM format
      const resetTimeString = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const limitMessage = `
        <div style="border:1.3px solid red; background-color:#fff0f0; padding:10px; margin:10px 0; border-radius:8px; color:#444444; font-size: 0.9rem">
        You have reached the message limit of ${MESSAGE_LIMIT} messages per ${durationInHours(WINDOW_DURATION)} hours. Please try again after ${resetTimeString}.
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
      await user.save();
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

app.post('/api/stop-stream', async (req, res) => {
  try {
    // Assuming stopStream is async, you need to await it
    await openaiApi.stopStream(); 
    res.json({ success: true, message: 'Stream stopped successfully' });
  } catch (error) {
    console.error('Error stopping the stream:', error);
    res.status(500).json({ success: false, message: 'Error stopping the stream', error: error.toString() });
  }
});

// Endpoint to post a new book action
app.post('/api/book-action', async (req, res) => {
  const { buttonClassName, title, author } = req.body;

  // Validation for required fields
  if (!buttonClassName) {
    return res.status(400).json({ message: 'Missing required fields: buttonClassName and title are required' });
  }

  try {
    // Create a new book action entry
    const newBookAction = new BookAction({
      buttonClassName,
      title,  // This field is now optional; it will be undefined if not provided
      author,  // This field is now optional; it will be undefined if not provided
      createdAt: new Date()  // Use the server's current date and time
    });

    // Save the new book action to the database
    const savedBookAction = await newBookAction.save();

    // Respond with the saved book action
    res.status(201).json(savedBookAction);
  } catch (error) {
    console.error('Error saving book action:', error);
    res.status(500).json({ message: 'Failed to record book action', error: error.toString() });
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
    const adminId = process.env.ADMIN_ID;
    
    const excludeIds = process.env.EXCLUDE_SESSION_IDS.split(','); // Array of IDs to exclude

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    let query = {};
    if (userId === adminId) {
      // Exclude sessions belonging to specified IDs when accessed by the admin
      query = { user: { $nin: excludeIds } };
    } else {
      // Non-admin users can only access their own sessions
      query = { user: userId };
    }

    const sessions = await Session.find(query);
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

async function fetchAndProcessBooks(query, countryCode) {
  try {
    query[`countrySpecific.${countryCode}.bookImage`] = { $exists: true };
    const books = await BookData.aggregate([
      { $match: query },
      { $limit: 80 },
      { $group: {
        _id: `$countrySpecific.${countryCode}.bookImage`,
        document: { $first: '$$ROOT' }
      }},
      { $replaceRoot: { newRoot: "$document" }}
    ]).exec();    

    let allBooks = books.map(book => {
      const countryData = book.countrySpecific[countryCode];
      const reviewCount = parseInt((countryData.amazonReviewCount || '0').replace(/,/g, ''), 10);
      return {
        _id: book._id,
        title: book.title,
        author: book.author,
        previewLink: book.previewLink,
        reviewCount: reviewCount,
        bookImage: countryData.bookImage,
        ...countryData
      };
    });
    
    allBooks.sort((a, b) => b.reviewCount - a.reviewCount);
    return allBooks;
    
  } catch (error) {
    console.error("Error processing books:", error);
    throw error; // Optionally rethrow to handle further up, or handle differently here
  }
}

app.post('/api/books', async (req, res) => {
  const { genre, countryCode } = req.body;

  // console.log("Received genre:", genre);  // Log the received genre

  if (typeof genre !== 'string') {
    console.error('Genre is not a string:', genre);
    return res.status(400).json({ message: 'Genre must be a string' });
  }

  try {
    if (genre.toLowerCase() === 'all') {
      res.json(await fetchAndProcessBooks({}, countryCode));
    } else {
      // Split the genre string by commas, trim whitespace and use regex for case-insensitive matching
      const genres = genre.split(',').map(g => g.trim());
      const regexGenres = genres.map(g => new RegExp(`^${g}$`, 'i'));
      const booksWithCountryData = await fetchAndProcessBooks({ genres: { $in: regexGenres } }, countryCode);
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

// development routes: 

if (process.env.NODE_ENV === 'local') { 

  // GET endpoint to retrieve book actions from the last 2 days
  app.get('/api/book-actions', async (req, res) => {
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const bookActions = await BookAction.find({
        createdAt: { $gte: twoDaysAgo }
      }).sort({ createdAt: -1 }); // Sorting by date, newest first

      res.status(200).json(bookActions);
    } catch (error) {
      console.error('Error retrieving book actions:', error);
      res.status(500).json({ message: 'Failed to retrieve book actions', error: error.toString() });
    }
  });

  app.get('/api/books/with-preview', async (req, res) => {
    try {
        // Fetch all books where previewLink is not an empty string
        const booksWithPreview = await BookData.find({
            previewLink: { $ne: '' } // Condition to match books where previewLink is not empty
        }).select('previewLink -_id'); // Select only the previewLink field and exclude the _id

        const totalCount = booksWithPreview.length; // Directly use the length of the array for total count

        if (totalCount === 0) {
            return res.status(404).json({
                message: 'No books found with preview links.'
            });
        }

        // Create an array of just the preview links
        const previewLinks = booksWithPreview.map(book => book.previewLink);

        res.json({
            message: 'Successfully retrieved books with preview links',
            totalBooks: totalCount, // Include the total count of matching records
            previewLinks: previewLinks // Return the list of preview links
        });
    } catch (error) {
        console.error('Error fetching books with preview links:', error);
        res.status(500).json({
            message: 'Server error occurred'
        });
    }
});

  app.get('/api/books/missing-preview', async (req, res) => {
    try {
        // Delete all books with an empty previewLink
        const deleteResult = await BookData.deleteMany({
            previewLink: '' // Condition to match books with an empty previewLink
        });

        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({
                message: 'No books found with missing preview links to delete.'
            });
        }

        res.json({
            message: 'Successfully deleted books with missing preview links',
            deletedBooksCount: deleteResult.deletedCount // Include the count of deleted records
        });
    } catch (error) {
        console.error('Error deleting books with missing preview links:', error);
        res.status(500).json({
            message: 'Server error occurred'
        });
    }
  });

  app.get('/api/books/missing-preview', async (req, res) => {
    try {
        // Fetch all books with an empty previewLink
        const booksWithMissingPreview = await BookData.find({
            previewLink: '' // Condition to match books with an empty previewLink
        });

        // Get the total count of books with an empty previewLink
        const totalCount = await BookData.countDocuments({
            previewLink: ''
        });

        if (totalCount === 0) {
            return res.status(404).json({
                message: 'No books found with missing preview links.'
            });
        }

        res.json({
            message: 'Successfully retrieved books with missing preview links',
            totalBooks: totalCount, // Include the total count of matching records
            books: booksWithMissingPreview // Return the complete list of books
        });
    } catch (error) {
        console.error('Error fetching books with missing preview links:', error);
        res.status(500).json({
            message: 'Server error occurred'
        });
    }
  });

  app.get('/api/anecdotes-by-image-src', async (req, res) => {
    try {
      const regexPattern = /<img\s+[^>]*src="(.*blank_image.*|.*books.google.com.*|)"/i;
      const anecdotes = await AnecdotesModel.find({
        anecdotes: { $regex: regexPattern }
      });
      res.json({
        message: 'Successfully retrieved anecdotes based on image source conditions',
        total: anecdotes.length,
        data: anecdotes
      });
    } catch (error) {
      console.error('Error fetching anecdotes:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });
  
  app.get('/api/delete-anecdotes-by-image-src', async (req, res) => {
    try {
      const regexPattern = /<img\s+[^>]*src="(.*blank_image.*|.*books.google.com.*|)"/i;
      const deletionResult = await AnecdotesModel.deleteMany({
        anecdotes: { $regex: regexPattern }
      });
      res.json({
        message: 'Successfully deleted anecdotes based on image source conditions',
        deletedCount: deletionResult.deletedCount
      });
    } catch (error) {
      console.error('Error deleting anecdotes:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });
  
  app.get('/api/quotes-by-image-src', async (req, res) => {
    try {
      const regexPattern = /<img\s+[^>]*src="(.*blank_image.*|.*books.google.com.*|)"/i;
      const quotes = await QuotesModel.find({
        quotes: { $regex: regexPattern }
      });
      res.json({
        message: 'Successfully retrieved quotes based on image source conditions',
        total: quotes.length,
        data: quotes
      });
    } catch (error) {
      console.error('Error fetching quotes:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });
  
  app.get('/api/delete-quotes-by-image-src', async (req, res) => {
    try {
      const regexPattern = /<img\s+[^>]*src="(.*blank_image.*|.*books.google.com.*|)"/i;
      const deletionResult = await QuotesModel.deleteMany({
        quotes: { $regex: regexPattern }
      });
      res.json({
        message: 'Successfully deleted quotes based on image source conditions',
        deletedCount: deletionResult.deletedCount
      });
    } catch (error) {
      console.error('Error deleting quotes:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });
  
  app.get('/api/key-insights-by-image-src', async (req, res) => {
    try {
      const regexPattern = /<img\s+[^>]*src="(.*blank_image.*|.*books.google.com.*|)"/i;
      const keyInsights = await KeyInsightsModel.find({
        keyInsights: { $regex: regexPattern }
      });
      res.json({
        message: 'Successfully retrieved key insights based on image source conditions',
        total: keyInsights.length,
        data: keyInsights
      });
    } catch (error) {
      console.error('Error fetching key insights:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });
  
  app.get('/api/delete-key-insights-by-image-src', async (req, res) => {
    try {
      const regexPattern = /<img\s+[^>]*src="(.*blank_image.*|.*books.google.com.*|)"/i;
      const deletionResult = await KeyInsightsModel.deleteMany({
        keyInsights: { $regex: regexPattern }
      });
      res.json({
        message: 'Successfully deleted key insights based on image source conditions',
        deletedCount: deletionResult.deletedCount
      });
    } catch (error) {
      console.error('Error deleting key insights:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });  

  app.get('/api/more-details-by-image-src', async (req, res) => {
    try {
      // Regex pattern to match 'blank_image', 'books.google.com' within the src attribute of an img tag or an empty src
      const regexPattern = /<img\s+[^>]*src="(.*blank_image.*|.*books.google.com.*|)"/i;
      const moreDetails = await MoreDetails.find({
        'detailedDescription': { $regex: regexPattern }
      });
  
      res.json({
        message: 'Successfully retrieved more details based on image source conditions',
        total: moreDetails.length,
        data: moreDetails
      });
    } catch (error) {
      console.error('Error fetching more details:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });  

  app.get('/api/delete-more-details-by-image-src', async (req, res) => {
    try {
      // Regex pattern to match 'blank_image', 'books.google.com' within the src attribute of an img tag or an empty src
      const regexPattern = /<img\s+[^>]*src="(.*blank_image.*|.*books.google.com.*|)"/i;
      const deletionResult = await MoreDetails.deleteMany({
        'detailedDescription': { $regex: regexPattern }
      });
  
      res.json({
        message: 'Successfully deleted more details based on image source conditions',
        deletedCount: deletionResult.deletedCount
      });
    } catch (error) {
      console.error('Error deleting more details:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });
  

  // GET Endpoint: Fetches books with 5 or fewer quotes
  app.get('/api/books-with-fewer-quotes', async (req, res) => {
    try {
        const allQuotes = await QuotesModel.find();
        const filteredQuotes = allQuotes.filter(quote => {
            const quotesCount = quote.quotes.split('</li>').length - 1;
            return quotesCount <= 5;
        });

        res.json({
            message: 'Successfully retrieved books with 5 or fewer quotes',
            total: filteredQuotes.length,
            data: filteredQuotes
        });
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // DELETE Endpoint: Deletes books with 5 or fewer quotes
  app.get('/api/delete-books-with-fewer-quotes', async (req, res) => {
    try {
        const allQuotes = await QuotesModel.find();
        const idsToDelete = allQuotes.filter(quote => {
            const quotesCount = quote.quotes.split('</li>').length - 1;
            return quotesCount <= 5;
        }).map(quote => quote._id);

        const deletionResult = await QuotesModel.deleteMany({ _id: { $in: idsToDelete } });
        res.json({
            message: 'Successfully deleted books with 5 or fewer quotes',
            deletedCount: deletionResult.deletedCount
        });
    } catch (error) {
        console.error('Error deleting quotes:', error);
        res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // GET Endpoint: Fetches books with 4 or fewer anecdotes
  app.get('/api/books-with-fewer-anecdotes', async (req, res) => {
    try {
        const allAnecdotes = await AnecdotesModel.find();
        const filteredAnecdotes = allAnecdotes.filter(anecdote => {
            const anecdotesCount = anecdote.anecdotes.split('</li>').length - 1;
            return anecdotesCount <= 4;
        });

        res.json({
            message: 'Successfully retrieved books with 4 or fewer anecdotes',
            total: filteredAnecdotes.length,
            data: filteredAnecdotes
        });
    } catch (error) {
        console.error('Error fetching anecdotes:', error);
        res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // DELETE Endpoint: Deletes books with 4 or fewer anecdotes
  app.get('/api/delete-books-with-fewer-anecdotes', async (req, res) => {
    try {
        const allAnecdotes = await AnecdotesModel.find();
        const idsToDelete = allAnecdotes.filter(anecdote => {
            const anecdotesCount = anecdote.anecdotes.split('</li>').length - 1;
            return anecdotesCount <= 4;
        }).map(anecdote => anecdote._id);

        const deletionResult = await AnecdotesModel.deleteMany({ _id: { $in: idsToDelete } });
        res.json({
            message: 'Successfully deleted books with 4 or fewer anecdotes',
            deletedCount: deletionResult.deletedCount
        });
    } catch (error) {
        console.error('Error deleting anecdotes:', error);
        res.status(500).json({ message: 'Server error occurred' });
    }
  });

  //endpoint that deletes records containing five or fewer key insights
  app.get('/api/delete-books-with-fewer-key-insights', async (req, res) => {
    try {
        // Fetch all key insights data
        const allKeyInsights = await KeyInsightsModel.find();
        // Identify records to delete
        const idsToDelete = allKeyInsights.filter(insight => {
            const insightsCount = insight.keyInsights.split('</li>').length - 1;
            return insightsCount <= 5;
        }).map(insight => insight._id);

        // Delete the identified records
        const deletionResult = await KeyInsightsModel.deleteMany({ _id: { $in: idsToDelete } });

        res.json({
            message: 'Successfully deleted books with 5 or fewer key insights',
            deletedCount: deletionResult.deletedCount
        });
    } catch (error) {
        console.error('Error deleting books:', error);
        res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // endpoint that retrieves records containing five or fewer key insights
  app.get('/api/books-with-fewer-key-insights', async (req, res) => {
    try {
        // Fetch all key insights data
        const allKeyInsights = await KeyInsightsModel.find();
        // Filter in application logic
        const booksWithFewerKeyInsights = allKeyInsights.filter(insight => {
            const insightsCount = insight.keyInsights.split('</li>').length - 1;
            return insightsCount <= 5;
        });

        res.json({
            message: 'Successfully retrieved books with 5 or fewer key insights',
            total: booksWithFewerKeyInsights.length,
            data: booksWithFewerKeyInsights
        });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'Server error occurred' });
    }
});


  // Endpoint to retrieve books with missing Amazon links for IN and US
  app.get('/api/books-with-missing-amazon-link', async (req, res) => {
    try {
      const query = {
        $or: [
          { 'countrySpecific.IN.amazonLink': { $eq: '' } },
          { 'countrySpecific.US.amazonLink': { $eq: '' } }
        ]
      };

      const booksWithMissingAmazonLink = await BookData.find(query);
      const totalCount = await BookData.countDocuments(query);

      res.json({
        message: 'Successfully retrieved books with missing Amazon link',
        total: totalCount,
        data: booksWithMissingAmazonLink
      });
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // Endpoint to retrieve books with ambiguous Amazon review counts for IN and US
  app.get('/api/books-with-ambiguous-amazon-review-count', async (req, res) => {
    try {
      const query = {
        $or: [
          { 'countrySpecific.IN.amazonReviewCount': '' },
          { 'countrySpecific.US.amazonReviewCount': '' }
        ]
      };
  
      const booksWithAmbiguousReviewCount = await BookData.find(query);
      const totalCount = await BookData.countDocuments(query);
  
      res.json({
        message: 'Successfully retrieved books with ambiguous Amazon review count',
        total: totalCount,
        data: booksWithAmbiguousReviewCount
      });
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // Endpoint to delete books with ambiguous Amazon review counts for IN and US
  app.get('/api/delete-books-with-ambiguous-amazon-review-count', async (req, res) => {
    try {
      const query = {
        $or: [
          { 'countrySpecific.IN.amazonReviewCount': '' },
          { 'countrySpecific.US.amazonReviewCount': '' }
        ]
      };
  
      const deletedBooks = await BookData.deleteMany(query);
  
      res.json({
        message: 'Successfully deleted books with ambiguous Amazon review count',
        deletedCount: deletedBooks.deletedCount
      });
    } catch (error) {
      console.error('Error deleting books:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // Endpoint to retrieve books without country-specific data
  app.get('/api/books-without-country-specific', async (req, res) => {
    try {
      const query = {
        countrySpecific: { $exists: false }  // Matches documents where countrySpecific field does not exist
      };
  
      const booksWithoutCountrySpecific = await BookData.find(query);
      const totalCount = await BookData.countDocuments(query);
  
      res.json({
        message: 'Successfully retrieved books without country-specific data',
        total: totalCount,
        data: booksWithoutCountrySpecific
      });
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });  

  // Endpoint to delete books with empty or missing genres
  app.get('/api/delete-books-without-genres', async (req, res) => {
    try {
      const query = {
        $or: [
          { genres: { $exists: false } }, // Matches documents where genres field does not exist
          { genres: { $size: 0 } }        // Matches documents where genres array is empty
        ]
      };

      const deleteResult = await BookData.deleteMany(query);
      res.json({
        message: 'Successfully deleted books without genres',
        deletedCount: deleteResult.deletedCount
      });
    } catch (error) {
      console.error('Error deleting books:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // Endpoint to get books with empty or missing genres
  app.get('/api/books-without-genres', async (req, res) => {
    try {
      const query = {
        $or: [
          { genres: { $exists: false } }, // Matches documents where genres field does not exist
          { genres: { $size: 0 } }        // Matches documents where genres array is empty
        ]
      };

      const booksWithoutGenres = await BookData.find(query);
      const totalCount = await BookData.countDocuments(query);

      res.json({
        message: 'Successfully retrieved books without genres',
        total: totalCount,
        data: booksWithoutGenres
      });
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // Endpoint to retrieve distinct genres from the book data
  app.get('/api/distinct-genres', async (req, res) => {
    try {
        const distinctGenres = await BookData.aggregate([
            { $unwind: "$genres" }, // Unwind the genres array to make each genre a separate document
            { $group: { _id: "$genres" } }, // Group by genres to get distinct genres
            { $sort: { _id: 1 } } // Optional: sort genres alphabetically
        ]);

        const count = distinctGenres.length; // Count of distinct genres
        res.json({
            message: 'Successfully retrieved distinct genres',
            count: count,
            data: distinctGenres.map(genre => genre._id) // Return genres as an array of strings
        });
    } catch (error) {
        console.error('Error fetching distinct genres:', error);
        res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // Endpoint to retrieve the most popular genres from the book data
  app.get('/api/most-popular-genres', async (req, res) => {
    try {
        const popularGenres = await BookData.aggregate([
            { $unwind: "$genres" },
            { $group: { _id: "$genres", count: { $sum: 1 } } }, // Group by genres and count occurrences
            { $sort: { count: -1 } }, // Sort genres by count in descending order
            { $limit: 20 } // Limit to top 20 genres
        ]);

        res.json({
            message: 'Successfully retrieved the most popular genres',
            data: popularGenres.map(genre => ({ genre: genre._id, count: genre.count }))
        });
    } catch (error) {
        console.error('Error fetching most popular genres:', error);
        res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // Unified endpoint to retrieve books based on combined image conditions
  app.get('/api/books-by-combined-image-conditions', async (req, res) => {
    try {
      const query = {
        $or: [
          { "countrySpecific.IN.bookImage": { "$regex": "blank_image", "$options": "i" } },
          { "countrySpecific.US.bookImage": { "$regex": "blank_image", "$options": "i" } },
          { 'countrySpecific.IN.bookImage': '' },
          { 'countrySpecific.US.bookImage': '' },
          { "countrySpecific.IN.bookImage": { "$regex": "books.google.com", "$options": "i" } },
          { "countrySpecific.US.bookImage": { "$regex": "books.google.com", "$options": "i" } }
        ]
      };

      const books = await BookData.find(query);
      const totalCount = await BookData.countDocuments(query);

      res.json({
        message: 'Successfully retrieved books with combined image conditions',
        total: totalCount,
        data: books
      });
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // Endpoint to delete books based on combined image conditions
  app.get('/api/delete-books-by-combined-image-conditions', async (req, res) => {
    try {
      const query = {
        $or: [
          { "countrySpecific.IN.bookImage": { "$regex": "blank_image", "$options": "i" } },
          { "countrySpecific.US.bookImage": { "$regex": "blank_image", "$options": "i" } },
          { 'countrySpecific.IN.bookImage': '' },
          { 'countrySpecific.US.bookImage': '' },
          { "countrySpecific.IN.bookImage": { "$regex": "http://books.google.com", "$options": "i" } },
          { "countrySpecific.US.bookImage": { "$regex": "http://books.google.com", "$options": "i" } }
        ]
      };

      const result = await BookData.deleteMany(query);
      res.json({
        message: 'Successfully deleted books with combined image conditions',
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Error deleting books:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });


  // Route for recent anecdotes
  app.get('/api/recent-anecdotes', async (req, res) => {
    const yesterday = new Date(Date.now() - 48*60*60*1000);
    try {
      const recentAnecdotes = await AnecdotesModel.find({
        createdAt: { $gt: yesterday }
      });
      res.json({
        message: 'Successfully retrieved recent anecdotes',
        data: recentAnecdotes
      });
    } catch (error) {
      console.error('Error fetching anecdotes:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // Route for recent quotes
  app.get('/api/recent-quotes', async (req, res) => {
    const yesterday = new Date(Date.now() - 48*60*60*1000);
    try {
      const recentQuotes = await QuotesModel.find({
        createdAt: { $gt: yesterday }
      });
      res.json({
        message: 'Successfully retrieved recent quotes',
        data: recentQuotes
      });
    } catch (error) {
      console.error('Error fetching quotes:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // Route for recent more details
  app.get('/api/recent-more-details', async (req, res) => {
    const yesterday = new Date(Date.now() - 48*60*60*1000);
    try {
      const recentDetails = await MoreDetails.find({
        createdAt: { $gt: yesterday }
      });
      res.json({
        message: 'Successfully retrieved more details',
        data: recentDetails
      });
    } catch (error) {
      console.error('Error fetching more details:', error);
      res.status(500).json({ message: 'Server error occurred' });
    }
  });

  // Route for recent key insights
  app.get('/api/recent-key-insights', async (req, res) => {
    try {
      const yesterday = new Date(Date.now() - 48*60*60*1000); // 24 hours ago
      const recentInsights = await KeyInsightsModel.find({
        createdAt: { $gt: yesterday }
      });

      res.json({
        message: 'Successfully retrieved recent key insights',
        data: recentInsights
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error occurred while fetching recent key insights' });
    }
  });

  // Route to fetch all users 
  app.get('/api/recent-users', async (req, res) => {
    const yesterday = new Date(Date.now() - 100000 * 60 * 60 * 1000); // Corrected to 24 hours ago
  
    try {
      const recentUsers = await User.find({
        createdAt: { $gt: yesterday }
      }).sort({ createdAt: -1 }); // Sorting users by creation date in descending order
  
      // Counting the users
      const count = recentUsers.length;
  
      res.json({
        message: 'Successfully retrieved recent users',
        totalUsers: count, // Total number of recent users
        users: recentUsers   // List of recent users sorted from latest to oldest
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error occurred while fetching recent users' });
    }
  });
  
 // api to fetch redis data
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

  // api to clear redis data
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

  // Endpoint to update the genres of books missing this field using the title and author
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

  // Endpoint to populate genres for books that have missing genre information
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

  // Endpoint to delete the genres field from all documents in the collection
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

  // Endpoint to correct the format of the genres field in documents where it is nested improperly
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

  
const extractTitleFromLink = (link) => {
  try {
    const url = new URL(link);
    const queryParams = url.searchParams;
    const rawQuery = queryParams.get('dq');

    if (rawQuery) {
      const intitleMatch = rawQuery.match(/intitle:([^+]+)/);
      return intitleMatch ? decodeURIComponent(intitleMatch[1]) : "";
    }
    
    return "";
  } catch (error) {
    console.error("Invalid URL provided:", error.message);
    return ""; // Return an empty string or handle the error as needed
  }
};

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

  const getAuthorBeforeAnd = (author) => {
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

const getTitleBeforeDelimiter = (title) => {
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

const getGoogleBookData = async (title, author) => {
  try {
    const authorBeforeAnd = getAuthorBeforeAnd(author);
    const query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(authorBeforeAnd)}`;
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${query}&key=${process.env.REACT_APP_GOOGLE_BOOKS_API_KEY}`);

    let previewLink = '';

    const titleBeforeDelimiter = getTitleBeforeDelimiter(title);
    const searchTitleNormalized = normalizeTitle(titleBeforeDelimiter);

    if (response.data.items?.length) {
      // console.log("response.data.items is", response.data.items);
      
      const book = response.data.items.find(item => {
        const itemTitleNormalized = normalizeTitle(item.volumeInfo.title);
        const itemPreviewLinkTitleNormalized = normalizeTitle(extractTitleFromLink(item.volumeInfo.previewLink));
        
        // Check if viewability is not 'NO_PAGES'
        const hasPreviewAvailable = item.accessInfo.viewability !== 'NO_PAGES';
        
        return hasPreviewAvailable && (itemTitleNormalized.includes(searchTitleNormalized) 
          || searchTitleNormalized.includes(itemTitleNormalized)
          || itemPreviewLinkTitleNormalized.includes(searchTitleNormalized) 
          || searchTitleNormalized.includes(itemPreviewLinkTitleNormalized));
      });
      
        
      if (book) {
        const { volumeInfo } = book;
        previewLink = volumeInfo.previewLink;
      }
    }
    return { previewLink};

  } catch (error) {
    console.error(`Error fetching book cover for ${title}:`, error);
    return { previewLink: '' };
  }
  };

  app.get('/api/books/preview-links-check', async (req, res) => {
    try {
      // Fetch 5 books from the database
      const books = await BookData.find({}).limit(20);
  
      // Map through each book and get new preview links without saving
      const bookLinks = books.map(async (book) => {
        const oldPreviewLink = book.previewLink; // Existing preview link
        const newPreviewLink = await getGoogleBookData(book.title, book.author); // Fetch new preview link
  
        return {
          title: book.title,
          author: book.author,
          oldPreviewLink: oldPreviewLink,
          newPreviewLink: newPreviewLink
        };
      });
  
      // Resolve all promises from map
      Promise.all(bookLinks).then(results => {
        res.json(results);
      });
      
    } catch (error) {
      res.status(500).json({ message: 'Error fetching book data', error });
    }
  });

  const delay = (duration) => {
    return new Promise(resolve => setTimeout(resolve, duration));
  }
  
  app.get('/api/books/update-preview-links', async (req, res) => {
    try {
      const books = await BookData.find({});
      let updatedCount = 0;
      let skippedCount = 0;
      let updatedIds = [];
      let skippedIds = [];
  
      for (const book of books) {
        // Get the newPreviewLink object, then access the 'previewLink' property
        const result = await getGoogleBookData(book.title, book.author);
        const newPreviewLink = result.previewLink;  // Extract the previewLink string
        await delay(1000); // Delay for 1 second to comply with rate limit
  
        if (newPreviewLink !== '') {
          book.previewLink = newPreviewLink;
          await book.save();
          updatedCount++;
          updatedIds.push(book._id);
        } else {
          skippedCount++;
          skippedIds.push(book._id);
        }
      }
  
      res.json({
        message: 'Update complete',
        updatedCount: updatedCount,
        skippedCount: skippedCount,
        updatedIds: updatedIds,
        skippedIds: skippedIds
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating preview links', error });
    }
  });

  app.get('/api/books/skipped-records', async (req, res) => {
    try {
      const skippedIds = [
        "6618a496520976150acc557b",
        "6618c2d3520976150acc608d",
        "661ca56c52cd569b7bcf0fc6",
        "6637ca462a9e87e81796fb67",
        "66384e422a9e87e8179703a6",
        "66426ce6e2c851008164eaaf",
        "666c06c36baa839da327d760",
        "666d36f5319836bb12ef8199",
        "666f250907a146297007417a",
        "66705e54134edc22e237e625",
        "66705e56134edc22e237e657",
        "6670702e7674a47057036f8e",
        "667070647674a47057037126",
        "66790fdedb1417497efcd2da"
      ].map(id => new mongoose.Types.ObjectId(id));  // Correctly using 'new' to create ObjectId
  
      const skippedRecords = await BookData.find({
        '_id': { $in: skippedIds }
      });
  
      res.json({
        message: 'Retrieved skipped records',
        data: skippedRecords
      });
    } catch (error) {
      console.error('Error during fetching skipped records:', error);  // Detailed logging
      res.status(500).json({
        message: 'Error retrieving skipped records',
        error: error.message || error // Providing detailed error information to the response
      });
    }
  }); 
  
  app.get('/api/books/count', async (req, res) => {
    try {
      // Count all documents in the BookData collection
      const count = await BookData.countDocuments();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: 'Error counting book records', error });
    }
  });
  
}






