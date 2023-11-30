const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const openaiApi = require('./openaiApi');
const Session = require('./Session');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/api/query', async (req, res) => {
  console.log('executing api/query endpoint');
  const { sessionId, message } = req.body;
  console.log(`Received new query for session ID: ${sessionId}`, message);

  try {
    console.log(`Looking for session with ID: ${sessionId}`);
    const session = await Session.findById(sessionId);
    if (!session) {
      console.log(`Session with ID: ${sessionId} not found`);
      return res.status(404).json({ message: 'Session not found' });
    }
    console.log(`Session with ID: ${sessionId} found, appending message to session history`);
    
    // Retrieve and append new message to session history
    session.messages.push(message);
    console.log('New message appended to session history:', message);

    // Log the current state of session.messages to check for duplicates
    console.log('Current session messages:', session.messages.map(m => m.content));

    // Send entire conversation history to GPT-4
    console.log('Sending conversation history to GPT-4 API:', JSON.stringify(session.messages));

    const response = await openaiApi(session.messages);

    // Append GPT-4's response to the session
    if (response) {
      console.log('Received response from GPT-4 API:', response);

      // Log to check if the response already exists in the session messages
      console.log('Checking if the GPT-4 response is already in the session messages:', session.messages.map(m => m.content).includes(response));

      session.messages.push({ role: 'assistant', content: response });
      console.log('Appending GPT-4 response to session history');
      await session.save();
      console.log('Session history updated and saved with GPT-4 response');
    } else {
      console.log('No response received from GPT-4 API');
    }

    res.json({ response });
    console.log('Response sent back to client');
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ message: 'Error processing your query', error: error.toString() });
  }
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
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
  console.log('GET /api/sessions - Retrieving all sessions');
  try {
    const sessions = await Session.find().populate('messages');
    console.log('GET /api/sessions - Retrieved sessions:', sessions);

    res.json(sessions);
  } catch (error) {
    console.error('GET /api/sessions - Error:', error);
    res.status(500).json({ message: 'Error retrieving sessions', error: error.toString() });
  }
});

