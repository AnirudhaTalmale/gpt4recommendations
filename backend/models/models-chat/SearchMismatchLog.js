const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define a schema for search mismatch log
const searchMismatchLogSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  country: { type: String, required: true },
  searchedTitle: { type: String, required: true },
  returnedTitle: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Create a model from the schema
module.exports = mongoose.model('SearchMismatchLog', searchMismatchLogSchema);
