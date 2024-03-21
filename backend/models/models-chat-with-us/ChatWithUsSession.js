const mongoose = require('mongoose');
const { Schema } = mongoose;

// Attachment Schema
const attachmentSchema = new Schema({
  data: { type: String, required: true }, // Base64 string of the file
  filename: { type: String, required: true }, // Original filename
  mimetype: { type: String, required: true }, // MIME type of the file
});

// Message Schema
const messageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  contentType: { type: String, default: 'simple', required: true },
  content: { type: String },
  attachments: [attachmentSchema],
  timestamp: { type: Date, default: Date.now }
});

const chatWithUsSessionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionName: { type: String, default: 'New Session' },
  messages: [messageSchema],
});

module.exports = mongoose.model('ChatWithUsSession', chatWithUsSessionSchema);
