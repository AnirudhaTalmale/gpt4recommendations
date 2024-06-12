const mongoose = require('mongoose');
const { Schema } = mongoose;

const emailRateLimitSchema = new Schema({
  email: { type: String, unique: true, required: true },
  count: { type: Number, default: 1 }, 
  lastSent: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('EmailRateLimit', emailRateLimitSchema);
