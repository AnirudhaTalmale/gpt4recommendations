const mongoose = require('mongoose');
const { Schema } = mongoose;

const clickCountSchema = new Schema({
  userEmail: { type: String, required: true, index: true }, // Store user email and index it for fast lookup
  buttonId: { type: String, default: 'buyNowButton' },      // Identifier for the button if there are multiple buttons
  count: { type: Number, default: 0 },                     // Number of times the user has clicked
  createdAt: { type: Date, default: Date.now },            // Record creation date
  updatedAt: { type: Date, default: Date.now }             // Last update date
});

module.exports = mongoose.model('ClickCount', clickCountSchema);
