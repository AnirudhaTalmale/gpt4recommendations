const mongoose = require('mongoose');
const { Schema } = mongoose;

const visitSchema = new Schema({
  userId: { type: String, required: true, index: true },  // Unique identifier for the visitor
  page: { type: String, required: true, index: true },    // The page visited, e.g., "home"
  timestamp: { type: Date, default: Date.now, index: true } // The time of the visit
});

module.exports = mongoose.model('Visit', visitSchema);
