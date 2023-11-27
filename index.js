const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const openaiApi = require('./openaiApi'); // Make sure you have this file created
const Session = require('./Session'); // Make sure you have this file created
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware for JSON request parsing
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/api/query', async (req, res) => {
  const { messages } = req.body;
  try {
    const response = await openaiApi(messages);
    res.json({ response });
  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ message: 'Error processing your query', error: error.toString() });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// POST endpoint for creating a new session
app.post('/api/session', async (req, res) => {
  try {
    const newSession = new Session({ messages: [] });
    await newSession.save();
    res.json(newSession);
  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ message: 'Error creating a new session', error: error.toString() });
  }
});

// GET endpoint for retrieving all sessions with their messages
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Session.find().populate('messages');
    res.json(sessions);
  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ message: 'Error retrieving sessions', error: error.toString() });
  }
});

// POST endpoint for adding a message to a session
app.post('/api/session/:sessionId/message', async (req, res) => {
  console.log('Received request to add message to session');
  
  const { sessionId } = req.params;
  // Now the request body will directly contain the query and response, not nested inside message
  const { query, response } = req.body;

  // Log the session ID, query, and response
  console.log(`Session ID: ${sessionId}`);
  console.log(`Query: ${query}`);
  console.log(`Response: ${response}`);

  try {
    // Find the session by ID
    const session = await Session.findById(sessionId);
    console.log('Session fetched from database:', session);

    if (!session) {
      console.log('No session found with ID:', sessionId);
      return res.status(404).json({ message: 'Session not found' });
    }

    // Push the new message into the session's messages array
    session.messages.push({ query, response }); // Adjusted to push an object with query and response
    console.log('New message object to be added:', { query, response });

    // Save the session with the new message
    await session.save();
    console.log('Session saved with new message:', session);

    // Respond with the updated session
    res.json(session);
  } catch (error) {
    // If an error occurs, log it and return a 500 status code
    console.error('Backend error adding message to session:', error);
    res.status(500).json({ message: 'Error adding message to session', error: error.toString() });
  }
});
