const cors = require('cors');
const mongoose = require('mongoose');
const openaiApi = require('./openaiApi');
const Session = require('./Session');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');


const bookRecommendationPrompt = require('./promptTemplate');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());
const io = new Server(server, {
  cors: {} // Allow all origins and methods by default
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('query', async (data) => {
    const { sessionId, message } = data;

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

    console.log("Saving user message");

    await session.save();

    try {
      const completePrompt = bookRecommendationPrompt(message.content);

      // Call openaiApi to process and emit chunks
      await openaiApi([{ role: 'user', content: completePrompt }], socket, session);

    } catch (error) {
      console.error('Error processing query:', error);
      socket.emit('error', 'Error processing your request'); // Emit error to the client
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
