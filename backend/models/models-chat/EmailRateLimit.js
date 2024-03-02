const mongoose = require('mongoose');
const { Schema } = mongoose;

const emailRateLimitSchema = new Schema({
  email: { type: String, unique: true, required: true },
  count: { type: Number, default: 1 }, // Starts with 1 as it's created on first email sent
  lastSent: { type: Date, default: Date.now } // Timestamp of the last email sent
});

module.exports = mongoose.model('EmailRateLimit', emailRateLimitSchema);
