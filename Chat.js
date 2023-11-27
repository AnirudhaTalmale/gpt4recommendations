const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  query: String,
  response: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);
