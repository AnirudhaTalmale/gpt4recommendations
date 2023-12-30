const mongoose = require('mongoose');
const { Schema } = mongoose;

// Message Schema
const messageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  contentType: { type: String, default: 'simple', required: true },
  content: { type: String } 
});

// Session Schema
const sessionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' }, // Reference to User model
  sessionName: { type: String, default: 'New Chat' },
  messages: [messageSchema]
});


module.exports = mongoose.model('Session', sessionSchema);
