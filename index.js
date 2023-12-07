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

app.post('/api/query', async (req, res) => {
  const { sessionId, message } = req.body;
  console.log(`Received new query for session ID: ${sessionId}`, message);

  const completePrompt = bookRecommendationPrompt(message.content);
  console.log('Constructed complete prompt:', completePrompt);

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      console.log(`Session with ID: ${sessionId} not found`);
      return res.status(404).json({ message: 'Session not found' });
    }

    const userMessage = {
      ...message,
      contentType: 'simple' // Assuming all user messages are simple text
    };

    session.messages.push(userMessage);
    console.log('User query appended to session history:', userMessage);

    let response = await openaiApi([{ role: 'system', content: completePrompt }]);
    console.log('Raw response from GPT model:', response);

    let responseContent = response; // Default to raw response
    let contentType = 'simple'; // Default to simple

    // Check if the response is stringified JSON (starts with '[' or '{')
    if (typeof response === 'string' && (response.startsWith('[') || response.startsWith('{'))) {
      try {
        responseContent = JSON.parse(response); // Parse if it's a JSON string
        contentType = 'bookRecommendation'; // Set to bookRecommendation if parsing is successful
      } catch (e) {
        console.error('Failed to parse response:', e);
        // If parsing fails, it's still a simple response
      }
    }

    // Generate a temporary _id if not present (for GPT-4 responses)
    const tempId = new mongoose.Types.ObjectId(); // Generates a new unique ObjectId

    // Push the assistant's response with the string representation of the temporary _id
    session.messages.push({ 
      role: 'assistant', 
      contentType, 
      content: responseContent,
      _id: tempId.toString() // Directly use the string representation
    });

    console.log('Assistant response appended to session history:', { contentType, content: responseContent });
    await session.save();
    console.log('Session saved with new messages.');

    res.status(200).json({ message: 'Response processed and saved' }); 
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
    const sessions = await Session.find();
    console.log('GET /api/sessions - Retrieved sessions:', sessions);

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
