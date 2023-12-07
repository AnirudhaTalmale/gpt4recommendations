const mongoose = require('mongoose');
const { Schema } = mongoose;


// Message Schema
const messageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  contentType: { type: String, enum: ['simple', 'bookRecommendation'], required: true },
  content: { 
    type: Schema.Types.Mixed, // Mixed type for flexibility
    required: true 
  } 
});

// No discriminator is used here. The content type will be managed by application logic.

// Session Schema
const sessionSchema = new Schema({
  messages: [messageSchema]
});

module.exports = mongoose.model('Session', sessionSchema);
