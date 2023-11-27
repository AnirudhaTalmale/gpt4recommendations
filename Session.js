const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  query: String,
  response: String
});

const sessionSchema = new mongoose.Schema({
  messages: [chatSchema], 
});

module.exports = mongoose.model('Session', sessionSchema);
