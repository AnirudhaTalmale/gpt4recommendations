const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define a schema for the error log
const bookDataErrorLogSchema = new Schema({
  bookDataObjectId: { type: String, required: false },
  title: { type: String, required: true },
  author: { type: String, required: true },
  userCountry: { type: String, required: true },
  error: { type: String, required: true }, // JSON string of the error object
  timestamp: { type: Date, default: Date.now }
});

// Create a model from the schema
module.exports = mongoose.model('BookDataErrorLog', bookDataErrorLogSchema);