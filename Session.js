const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true }
});

const sessionSchema = new mongoose.Schema({
  messages: [messageSchema]
});

module.exports = mongoose.model('Session', sessionSchema);

