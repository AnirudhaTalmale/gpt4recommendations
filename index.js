const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const openaiApi = require('./openaiApi');
const Session = require('./Session');
const bookRecommendationPrompt = require('./promptTemplate');
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.post('/api/query', async (req, res) => {
  const { sessionId, message } = req.body;

  try {
    // Construct the prompt for GPT-4
    const completePrompt = bookRecommendationPrompt(message.content);

    // Get the response from GPT-4
    let response = await openaiApi([{ role: 'system', content: completePrompt }]);

    // Parse the response if it's JSON (for book recommendations)
    let parsedResponse = response;
    if (response.startsWith('[') || response.startsWith('{')) {
      parsedResponse = JSON.parse(response);
    }

    // Find the session and update it with the new message and response
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Add the user message
    session.messages.push({
      role: 'user',
      contentType: 'simple',
      content: message.content
    });

    // Add the assistant's response
    session.messages.push({
      role: 'assistant',
      contentType: Array.isArray(parsedResponse) ? 'bookRecommendation' : 'simple',
      content: parsedResponse
    });

    await session.save();
    // Return the response to the front-end
    res.status(200).json({ response: parsedResponse });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ message: 'Error processing your query', error: error.toString() });
  }
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
