const mongoose = require('mongoose');
const openaiApi = require('./openaiApi');
const Session = require('./Session');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bookRecommendationPrompt = require('./promptTemplate');
const passportSetup = require('./passport-setup'); // Import the setup function
const axios = require('axios');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

const cors = require('cors');

// Update CORS configuration to allow specific origin and credentials
const corsOptions = {
  origin: 'http://localhost:3001', // Your frontend's URL
  credentials: true, // Enable credentials
};

app.use(cors(corsOptions)); // Apply updated CORS options

const io = new Server(server, {
  cors: corsOptions // Use the same CORS options for Socket.io
});

app.use(express.json()); 

const session = require('express-session');

// Session configuration
const sessionConfig = {
  secret: 'your_secret_key', // Replace with a secret key of your choice
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using https
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

app.get('/api/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true });
  } else {
    res.json({ isAuthenticated: false });
  }
}); 

app.get('/api/user-info', (req, res) => {
  if (req.isAuthenticated()) {
    // Assuming 'user' is the authenticated user's document from the database
    res.json({
      isAuthenticated: true,
      user: {
        name: req.user.displayName,
        email: req.user.email,
        image: req.user.image // URL of the Google account image
      }
    });
  } else {
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


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function estimateTokenCount(text) {
  // Rough estimate of token count for a given text
  return text.trim().split(/\s+/).length;
}

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('query', async (data) => {
    const { sessionId, message } = data;
  
    // Find the session and update it with the new message and response
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
  
    // Generate the complete prompt using the bookRecommendationPrompt function
    const completePrompt = bookRecommendationPrompt(message.content);
  
    let totalTokenCount = estimateTokenCount(completePrompt);
    const messagesForGPT4 = [{ role: 'user', content: completePrompt }];
  
    // Iterate through past messages in reverse order and add them until the token limit is near
    for (let i = session.messages.length - 1; i >= 0 && totalTokenCount < 1500; i--) {
      const msg = session.messages[i];
      const tokenCount = estimateTokenCount(msg.content);
      if (totalTokenCount + tokenCount < 1500) {
        messagesForGPT4.unshift({ role: msg.role, content: msg.content }); // Add to the beginning of the array
        totalTokenCount += tokenCount;
      } else {
        break; // Stop if adding the next message would exceed the limit
      }
    }
  
    // Add the user message to the session and save
    session.messages.push({
      role: 'user',
      contentType: 'simple',
      content: message.content
    });
  
    await session.save();
  
    try {
      await openaiApi(messagesForGPT4, socket, session);
    } catch (error) {
      console.error('Error processing query:', error);
      socket.emit('error', 'Error processing your request');
    }
  });  

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});


// POST endpoint for creating a new session
app.post('/api/session', async (req, res) => {
  console.log('POST /api/session - Creating a new session');
  try {
    const newSession = new Session({ messages: [] });
    await newSession.save();
    console.log('POST /api/session - New session saved:', newSession);

    res.json(newSession);
  } catch (error) {
    console.error('POST /api/session - Error:', error);
    res.status(500).json({ message: 'Error creating a new session', error: error.toString() });
  }
});

// GET endpoint for retrieving all sessions with their messages
app.get('/api/sessions', async (req, res) => {
  // console.log('GET /api/sessions - Retrieving all sessions');
  try {
    const sessions = await Session.find();
    // console.log('GET /api/sessions - Retrieved sessions:', sessions);

    res.json(sessions);
  } catch (error) {
    console.error('GET /api/sessions - Error:', error);
    res.status(500).json({ message: 'Error retrieving sessions', error: error.toString() });
  }
});

// DELETE endpoint for deleting a session
app.delete('/api/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  console.log(`DELETE /api/session/:sessionId - Deleting session with ID: ${sessionId}`);
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
