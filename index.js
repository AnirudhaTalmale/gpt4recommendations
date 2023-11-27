const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const openaiApi = require('./openaiApi'); // Make sure you have this file created
const Chat = require('./Chat'); // Make sure you have this file created
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

// // GET endpoint for chat history
// app.get('/api/history', async (req, res) => {
//   const chats = await Chat.find().sort({ timestamp: -1 });
//   res.json(chats);
// });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
