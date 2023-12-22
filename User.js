const mongoose = require('mongoose');
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema({
  googleId: { type: String, required: true, unique: true }, // Unique Google ID
  displayName: { type: String, required: true }, // User's display name
  firstName: { type: String, required: true }, // User's first name
  lastName: { type: String, required: true }, // User's last name
  image: { type: String }, // URL of the user's profile picture
  email: { type: String, required: true, unique: true }, // User's email address
  createdAt: { type: Date, default: Date.now }, // Record creation date
  accessToken: { type: String }, // Google Access Token
});

module.exports = mongoose.model('User', userSchema);
