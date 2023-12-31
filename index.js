const mongoose = require('mongoose');
const openaiApi = require('./openaiApi');
const Session = require('./Session');
const BlogPost = require('./BlogPost'); // Adjust the path as necessary
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bookRecommendationPrompt = require('./promptTemplate');
const passportSetup = require('./passport-setup'); // Import the setup function
const axios = require('axios');
const multer = require('multer');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

// For JSON payloads
app.use(express.json({ limit: '50mb' }));

// For URL-encoded payloads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    console.log('User data being sent:', req.user); // Log the user data

    res.json({
      isAuthenticated: true,
      user: {
        id: req.user._id, // Include the user's ID
        name: req.user.displayName,
        email: req.user.email,
        image: req.user.image // URL of the Google account image
      }
    });
  } else {
    res.status(401).json({ isAuthenticated: false });
  }
});


app.post('/api/stop-stream', (req, res) => {
  try {
    openaiApi.stopStream();
    res.json({ message: 'Stream stopped successfully' });
  } catch (error) {
    console.error('Error stopping the stream:', error);
    res.status(500).json({ message: 'Error stopping the stream', error: error.toString() });
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

// Function to extract text between <h3> and <div> tags, excluding the <div> tag and its contents
function extractTags(content) {
  // Use a regex to match text between <h3> tags and the start of <div> tags
  const h3Matches = content.match(/<h3>(.*?)<div>/g) || [];
  const extractedText = h3Matches.map(match => 
    match.replace(/<h3>/g, '').replace(/<div>.*/g, '').trim()
  );

  return extractedText.join('\n'); // Joining with newline character
}


io.on('connection', (socket) => {
  console.log('A user connected');
  let currentSessionId;

  socket.on('query', async (data) => {
    const { sessionId, message } = data;
    currentSessionId = sessionId; 
  
    // Find the session and update it with the new message and response
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Add the user message to the session and save
    session.messages.push({
      role: 'user',
      contentType: 'simple',
      content: message.content
    });
  
    await session.save();

    const completePrompt = bookRecommendationPrompt(message.content);
    const currentMessageTokenCount = estimateTokenCount(completePrompt);
    let pastMessageTokenCount = 0;
    const pastMessageTokenThreshold = 120; 
    const currentMessageTokenThreshold = 150; 

    if (currentMessageTokenCount > currentMessageTokenThreshold) {
      // Emit a warning message to the client
      socket.emit('chunk', 'Input message too large');
    
      // Add a response message to the session indicating the issue and save it
      session.messages.push({
        role: 'assistant',
        contentType: 'simple',
        content: 'Input message too large'
      });
      await session.save();
    } 
    else {

      if (message.isFirstQuery) {
        // Get the 4-word summary
        const summary = await openaiApi.getSummary(message.content);
        session.sessionName = summary; // Update the session name with the summary
        await session.save(); // Don't forget to save the updated session

        // Emit an event to update the session name in the frontend
        socket.emit('updateSessionName', { sessionId: session._id, sessionName: summary });
      }
    
      const messagesForGPT4 = [{ role: 'user', content: completePrompt }];
    
      // Iterate through past messages in reverse order and add them until the token limit for past messages is near
      for (let i = session.messages.length - 2; i >= 0 && pastMessageTokenCount < pastMessageTokenThreshold; i--) {
        const msg = session.messages[i];
        let contentToInclude = msg.content;

        // Check if the message is from the assistant and has more than three bold tags
        if (msg.role === 'assistant' && (msg.content.match(/<b>(.*?)<\/b>/g) || []).length > 3) {
          contentToInclude = extractTags(msg.content);
        }

        const intermediateTokenCount = estimateTokenCount(contentToInclude);
        if (pastMessageTokenCount + intermediateTokenCount < pastMessageTokenThreshold) {
          messagesForGPT4.unshift({ role: msg.role, content: contentToInclude }); // Add to the beginning of the array
          pastMessageTokenCount += intermediateTokenCount;
        } else {
          break; // Stop if adding the next message would exceed the token threshold for past messages
        }
      }

      try {
        console.log("messagesForGPT4", messagesForGPT4);
        await openaiApi(messagesForGPT4, socket, session);
      } catch (error) {
        console.error('Error processing query:', error);
        socket.emit('error', 'Error processing your request');
      }
    }
  });  

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// POST endpoint for creating a new session
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
  const userId = req.query.userId;
  console.log('Received userId:', userId);

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

// End points for Blog posts

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

app.delete('/api/blogposts/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const blogPost = await BlogPost.findByIdAndDelete(postId);
    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.status(200).json({ message: 'Blog post deleted' });
  } catch (error) {
    console.error('DELETE /api/blogposts/:postId - Error:', error);
    res.status(500).json({ message: 'Error deleting the blog post', error: error.toString() });
  }
});

app.put('/api/blogposts/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const updatedPost = await BlogPost.findByIdAndUpdate(postId, req.body, { new: true });
    if (!updatedPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.json(updatedPost);
  } catch (error) {
    console.error('PUT /api/blogposts/:postId - Error:', error);
    res.status(500).json({ message: 'Error updating the blog post', error: error.toString() });
  }
});


