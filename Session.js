const mongoose = require('mongoose');
const { Schema } = mongoose;

// Message Schema
// Note: The content type is String as only simple text is used.
const messageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  contentType: { type: String, default: 'simple', required: true },
  content: { type: String, required: true } 
});

// Session Schema
const sessionSchema = new Schema({
  messages: [messageSchema]
});

module.exports = mongoose.model('Session', sessionSchema);
