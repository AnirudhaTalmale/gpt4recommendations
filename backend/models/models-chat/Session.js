const mongoose = require('mongoose');
const { Schema } = mongoose;

// Message Schema with timestamps
const messageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  contentType: { type: String, default: 'simple', required: true },
  content: { type: String }
}, { timestamps: true }); // Enable timestamps

// Session Schema
const sessionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  sessionName: { type: String, default: 'New Chat' },
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
