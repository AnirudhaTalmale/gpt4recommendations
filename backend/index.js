const mongoose = require('mongoose');
const openaiApi = require('./openaiApi');
const Session = require('./models/models-chat/Session');
const EmailRateLimit = require('./models/models-chat/EmailRateLimit');
const MoreDetails = require('./models/models-chat/MoreDetails');
const Book = require('./models/models-chat/GoogleBookData');
const KeyInsightsModel = require('./models/models-chat/KeyInsights'); 
const AnecdotesModel = require('./models/models-chat/Anecdotes'); 
const ChatWithUsSession = require('./models/models-chat-with-us/ChatWithUsSession');
const UserSession = require('./models/models-chat-with-us/UserSession');
const BlogPost = require('./models/models-chat/BlogPost'); // Adjust the path as necessary
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bookRecommendationPrompt = require('./prompts/promptBook');
const moreBooksRecommendationPrompt = require('./prompts/promptMoreBooks');
const moreDetailsPrompt = require('./prompts/promptMoreDetails');
const keyInsightsPrompt = require('./prompts/promptKeyInsights');
const anecdotesPrompt = require('./prompts/promptAnecdotes');
const passportSetup = require('./passport-setup'); // Import the setup function
const axios = require('axios');
const multer = require('multer');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); 
  
 
require('dotenv').config();

const app = express();
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
    mongoUrl: process.env.MONGO_URI,
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

mongoose.connect(process.env.MONGO_URI) 
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
  console.log('Received request on /api/check-auth');
  console.log('Session details:', req.session);

  if (req.isAuthenticated()) {
    console.log('User is authenticated');

    // Check if onboarding is complete based on the displayName being set
    if (req.user.displayName) {
      console.log('Onboarding is complete for user:', req.user.displayName);
      res.json({ isAuthenticated: true, onboardingComplete: true, user: req.user });
    } else {
      console.log('Onboarding is not complete for user:', req.user);
      res.json({ isAuthenticated: true, onboardingComplete: false, user: req.user });
    }
  } else {
    console.log('User is not authenticated');
    res.json({ isAuthenticated: false });
  }
}); 

app.get('/api/user-info', (req, res) => {
  console.log('Received request on /api/user-info');

  if (req.isAuthenticated()) {
    console.log('User is authenticated');

    let email = req.user.local && req.user.local.email ? req.user.local.email : '';
    console.log('Email obtained:', email);

    let image = req.user.image;
    if (!image) {
      console.log('No image found for user, getting default image');
      image = getDefaultImage(req.user.displayName);
    } else {
      console.log('User image found');
    }

    const userInfo = {
      id: req.user._id,
      name: req.user.displayName,
      email: email,
      image: image,
      role: req.user.role
    };

    console.log('Sending user info:', userInfo);
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
      console.error('Error revoking Google token:', err);
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
          <p style="font-size: 16px;">To continue setting up your OpenAI account, please verify that this is your email address.</p>
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
    const { sessionId, message, isMoreDetails, isKeyInsights, isAnecdotes, bookTitle, author, moreBooks, isEdit } = data;
    currentSessionId = sessionId; 
  
    // Find the session and update it with the new message and response
    const session = await Session.findById(sessionId).populate('user');
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!isMoreDetails && !moreBooks && !isKeyInsights && !isAnecdotes && !isEdit) {
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
      socket.emit('messageLimitReached', { content: limitMessage, sessionId: currentSessionId, isMoreDetails, isKeyInsights, isAnecdotes });
    
      if(!isMoreDetails && message.isFirstQuery && !isKeyInsights && !isAnecdotes) {
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

      if (message.isFirstQuery && !isMoreDetails && !isKeyInsights && !isAnecdotes && !moreBooks) {
        // Get the 4-word summary
        const summary = await openaiApi.getSummary(message.content);
        session.sessionName = summary; // Update the session name with the summary
        await session.save(); // Don't forget to save the updated session
        socket.emit('updateSessionName', { sessionId: session._id, sessionName: summary });
      }
    
      const messagesForGPT4 = [{ role: 'user', content: completePrompt }];

      try {
        console.log("messagesForGPT4", messagesForGPT4);
        await openaiApi(messagesForGPT4, socket, session, currentSessionId, isMoreDetails, isKeyInsights, isAnecdotes, bookTitle, author, moreBooks);
        await session.user.save();
      } catch (error) {
        console.error('Error processing query:', error);
        socket.emit('error', 'Error processing your request');
      }
    }
  });   

  socket.on('join-chat-session', (sessionId) => {
    socket.join(sessionId);
  });

  const processAttachments = (attachments) => { 
    return attachments.map((base64String, index) => {
      if (!base64String) return null; // If there's no attachment, return null
      const mimeType = base64String.match(/^data:(.*);base64,/)[1];
      const filename = `attachment_${Date.now()}_${index}`;
      const size = Buffer.from(base64String.split(',')[1], 'base64').length;
  
      console.log(`Attachment ${index + 1}: Size = ${size} bytes`); // Log the size of the attachment
  
      return { data: base64String, filename, mimetype: mimeType, size };
    }).filter(attachment => attachment != null); // Filter out any null values
  };
  
  const calculateUnseenMessages = async (userId, sessionId) => {
    // Find the user session
    const userSession = await UserSession.findOne({ user: userId, session: sessionId });
    if (!userSession) {
        return 0; // If no user session or last seen message, return 0
    }

    const session = await ChatWithUsSession.findById(sessionId);
    if (!session) return 0;
  
    // Find the index of the last seen message
    const lastSeenIndex = session.messages.findIndex(message => message._id.equals(userSession.lastSeenMessage));
    if (lastSeenIndex === -1) {
        return session.messages.length; // If last seen message not found, all messages are unseen
    }

    return session.messages.length - lastSeenIndex - 1;
  };

  const processSocketMessage = async (data, role) => {
    const { sessionId, message, attachments, userId } = data;
  
    const chatWithUsSession = await ChatWithUsSession.findById(sessionId);
    if (!chatWithUsSession) {
      socket.emit('error', { message: 'Chat with us session not found' });
      return;
    }
  
    const processedAttachments = processAttachments(attachments || []);
    const timestamp = message.timestamp; // Use the timestamp from the frontend
  
    // Add the new message to the session
    chatWithUsSession.messages.push({
      role: role,
      contentType: 'simple',
      content: message.content,
      attachments: processedAttachments,
      timestamp: timestamp // Use the frontend timestamp here
    });
    await chatWithUsSession.save();

    const senderSession = await UserSession.findOne({ user: userId, session: sessionId });
    if (senderSession) {
      senderSession.lastSeenMessage = chatWithUsSession.messages[chatWithUsSession.messages.length - 1]._id;
      senderSession.lastSeenAt = new Date();
      await senderSession.save();
    }

    
    console.log("triggering chat-with-us-update", sessionId, message);
    // Emit the updated message to all clients in the session
    socket.to(sessionId).emit('chat-with-us-update', {
      sessionId: sessionId,
      message: {
        ...message,
        attachments: processedAttachments,
        timestamp: timestamp // Include the frontend timestamp in the socket emission
      }
    });

    const userSessions = await UserSession.find({ session: sessionId, user: { $ne: userId } });
    userSessions.forEach(async (userSession) => {
      const unseenCount = await calculateUnseenMessages(userSession.user, sessionId);
      // Change this to broadcast to the session
      socket.to(sessionId).emit('unseen-message-count', {
        userId: userSession.user,  // Include the user ID in the payload
        sessionId: sessionId,
        count: unseenCount
      });
    });
  };    
  
  socket.on('chat-with-us-query', async (data) => {
    console.log("processSocketMessage user");
    await processSocketMessage(data, 'user');
  });
  
  socket.on('chat-with-us-response', async (data) => {
    console.log("processSocketMessage assistant");
    await processSocketMessage(data, 'assistant');
  });
  
  socket.on('reset-unseen-count', async (data) => {
    const { sessionId, userId } = data;
  
    // Find the last message in the session
    const session = await ChatWithUsSession.findById(sessionId);
    const lastMessage = session.messages[session.messages.length - 1];
  
    // Update the UserSession
    await UserSession.findOneAndUpdate(
      { user: userId, session: sessionId },
      { lastSeenMessage: lastMessage ? lastMessage._id : null }
    );
  }); 

  // In your socket event handlers
  socket.on('request-session-state', async (sessionId) => {
    const session = await ChatWithUsSession.findById(sessionId)
                    .populate('messages') // Assuming messages are a separate collection
                    .exec();
    if (session) {
      socket.emit('session-state', session);
    } else {
      socket.emit('error', { message: 'Session not found' });
    }
  });

  
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});


// ----------------  chat-with-us endpoints ------------------------

app.get('/api/chat-with-us-sessions', async (req, res) => {
  try {
    const { userId, role } = req.query;
    let sessions;
    if (role === 'assistant') {
      sessions = await ChatWithUsSession.find();
    } else {
      sessions = await ChatWithUsSession.find({ user: userId });
    }

    const updatedSessions = await Promise.all(sessions.map(async (session) => {
      const userSession = await UserSession.findOne({ user: userId, session: session._id });
      const lastSeenIndex = session.messages.findIndex(message => message._id.equals(userSession?.lastSeenMessage));
      const unseenCount = session.messages.length - lastSeenIndex - 1;

      return {
        ...session.toObject(),
        unseenCount: unseenCount < 0 ? 0 : unseenCount
      };
    }));

    res.json(updatedSessions);
  } catch (error) {
    console.error('GET /api/chat-with-us-sessions - Error:', error);
    res.status(500).json({ message: 'Error retrieving Chat with Us sessions', error: error.toString() });
  }
});

const User = require('./models/models-chat/User'); // Import the User model

app.post('/api/chat-with-us-session', async (req, res) => {
  try {
    const { userId, receiverId } = req.body; // Assume you pass receiverId when creating a session
    if (!userId || !receiverId) {
      return res.status(400).json({ message: 'User ID and Receiver ID are required' });
    }

    // Fetch the users by userId and receiverId
    const user = await User.findById(userId);
    const receiver = await User.findById(receiverId); // Make sure you have a receiver user
    if (!user || !receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the current date and time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // Date in YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // Time in HH:MM

    // Create a new session with a dynamic name based on the user's first name, current date and time
    const newSession = new ChatWithUsSession({
      user: userId,
      messages: [],
      sessionName: `${user.firstName}'s Ticket created on ${currentDate} at ${currentTime}`
    });

    await newSession.save();
    io.emit('new-session', newSession, receiverId);

    // Create a UserSession for the initiator
    const newUserSession = new UserSession({
      user: userId,
      session: newSession._id,
      lastSeenMessage: null, // No messages yet
      lastSeenAt: new Date()
    });
    await newUserSession.save();

    // Create a UserSession for the receiver
    const newReceiverSession = new UserSession({
      user: receiverId,
      session: newSession._id,
      lastSeenMessage: null, // No messages yet
      lastSeenAt: new Date()
    });
    await newReceiverSession.save();

    res.json(newSession);
  } catch (error) {
    console.error('POST /api/chat-with-us-session - Error:', error);
    res.status(500).json({ message: 'Error creating a new Chat with us session', error: error.toString() });
  }
});


app.delete('/api/chat-with-us-session/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.body.userId; // Assuming you have the user ID of the one making the request

    // Find related UserSessions
    const relatedUserSessions = await UserSession.find({ session: sessionId });

    if (relatedUserSessions.length !== 2) {
      return res.status(400).json({ message: 'Invalid session state' });
    }

    // Identify the receiverId as the other user in the UserSessions
    const receiverId = relatedUserSessions.find(session => session.user.toString() !== userId).user;

    await ChatWithUsSession.findByIdAndDelete(sessionId);
    await UserSession.deleteMany({ session: sessionId });

    // Emit delete event to the receiver
    io.emit('delete-session', sessionId, receiverId);

    res.json({ message: 'Session and associated user sessions deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/chat-with-us-session/:sessionId - Error:', error);
    res.status(500).json({ message: 'Error deleting session', error: error.toString() });
  }
});

app.get('/api/get-user-by-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const user = await User.findOne({ 'local.email': email }).exec();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('GET /api/get-user-by-email - Error:', error);
    res.status(500).json({ message: 'Error retrieving user by email', error: error.toString() });
  }
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
    // Retrieve bookTitle and author from query parameters
    const { bookTitle, author } = req.query;

    // Initialize query object
    let query = {
      bookTitle: new RegExp(bookTitle, 'i') // Always search by title
    };

    // Add author to the query if it's provided
    if (author) {
      query.author = new RegExp(author, 'i');
    }

    // Perform a case-insensitive search
    const bookDetails = await MoreDetails.findOne(query);

    if (!bookDetails) {
      return res.status(404).json({ message: 'Details not found for this book' });
    }

    res.json(bookDetails);
  } catch (error) {
    console.error('Server error:', error); // Log the error for debugging
    res.status(500).json({ message: 'Server error occurred while fetching book details' });
  }
});


app.get('/api/key-insights', async (req, res) => { 
  try {
    // Retrieve bookTitle and author from query parameters
    const { bookTitle, author } = req.query;

    // Initialize query object
    let query = {
      bookTitle: new RegExp(bookTitle, 'i') // Always search by title
    };

    // Add author to the query if it's provided
    if (author) {
      query.author = new RegExp(author, 'i');
    }

    // Perform a case-insensitive search
    const keyInsightsResult = await KeyInsightsModel.findOne(query); // Use the correctly named model for the query

    if (!keyInsightsResult) {
      return res.status(404).json({ message: 'Key Insights not found for this book' });
    }

    res.json(keyInsightsResult);
  } catch (error) {
    console.error('Server error:', error); // Log the error for debugging
    res.status(500).json({ message: 'Server error occurred while fetching book details' });
  }
});

app.get('/api/anecdotes', async (req, res) => { 
  try {
    // Retrieve bookTitle and author from query parameters
    const { bookTitle, author } = req.query;

    // Initialize query object
    let query = {
      bookTitle: new RegExp(bookTitle, 'i') // Always search by title
    };

    // Add author to the query if it's provided
    if (author) {
      query.author = new RegExp(author, 'i');
    }

    // Perform a case-insensitive search
    const AnecdotesResult = await AnecdotesModel.findOne(query); // Use the correctly named model for the query

    if (!AnecdotesResult) {
      return res.status(404).json({ message: 'Key Insights not found for this book' });
    }

    res.json(AnecdotesResult);
  } catch (error) {
    console.error('Server error:', error); // Log the error for debugging
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

// Endpoint to get ISBN by book title
app.get('/api/book/isbn', async (req, res) => {
  try {
    const { bookTitle } = req.query; // Get book title from query parameter

    if (!bookTitle) {
      return res.status(400).json({ message: 'Book title is required' });
    }

    // Search for the book by title (case-insensitive)
    const book = await Book.findOne({ title: new RegExp(bookTitle, 'i') });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Return the ISBN number of the found book
    res.json({ isbn: book.isbn });
  } catch (error) {
    console.error('GET /api/book/isbn - Error:', error);
    res.status(500).json({ message: 'Error retrieving the ISBN', error: error.toString() });
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


// ---------------------- End points for Blog posts ----------------------------

app.post('/api/blogposts', upload.single('image'), async (req, res) => {
  try {
    // Extract text fields from req.body and file from req.file
    const { title, content } = req.body;
    let image;
    if (req.file) {
      // Convert file buffer to a string (e.g., Base64) or save to server and get URL
      image = req.file.buffer.toString('base64'); // Example conversion to Base64
    }

    const newPost = new BlogPost({ title, content, image });
    await newPost.save();

    res.status(201).json(newPost);
  } catch (error) {
    console.error('POST /api/blogposts - Error:', error);
    res.status(500).json({ message: 'Error creating a new blog post', error: error.toString() });
  }
});

app.get('/api/blogposts', async (req, res) => {
  try {
    const blogPosts = await BlogPost.find();
    res.json(blogPosts);
  } catch (error) {
    console.error('GET /api/blogposts - Error:', error);
    res.status(500).json({ message: 'Error retrieving blog posts', error: error.toString() });
  }
});

app.get('/api/blogposts/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const blogPost = await BlogPost.findById(postId);
    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.json(blogPost);
  } catch (error) {
    console.error('GET /api/blogposts/:postId - Error:', error);
    res.status(500).json({ message: 'Error retrieving the blog post', error: error.toString() });
  }
});