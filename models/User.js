const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define roles as an enumeration for better control
const roles = {
  USER: 'user',
  ADMIN: 'assistant'
};

// User Schema
const userSchema = new Schema({
  googleId: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String }, // removed required: true
  image: { type: String },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  accessToken: { type: String },
  role: { type: String, enum: Object.values(roles), default: roles.USER }, // User role
  firstMessageTimestamp: { type: Date }, // Timestamp of the first message in the window
  messageCount: { type: Number, default: 0 }, // Count of messages in the current window
});

module.exports = mongoose.model('User', userSchema);
