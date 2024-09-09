const mongoose = require('mongoose');
const { Schema } = mongoose;

const roles = {
  USER: 'user',
  ADMIN: 'assistant'
};

// Define the Subscription Schema
const subscriptionSchema = new Schema({
  subscriptionId: { type: String, required: true },
  currentEndDateUTC: { type: Date, default: null }  // Updated field name to indicate UTC
});

const userSchema = new Schema({
  local: {
    email: { type: String, unique: true, sparse: true }
  },
  google: {
    id: { type: String, unique: true, sparse: true }
  },
  displayName: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  image: { type: String },
  role: { type: String, enum: Object.values(roles), default: roles.USER },
  createdAt: { type: Date, default: Date.now },
  accessToken: { type: String },
  verificationToken: { type: String },  // JWT token for email verification
  verificationCode: { type: String },  // Verification code for email confirmation
  firstMessageTimestamp: { type: Date },
  lastMessageTimestamp: { type: Date },
  messageCount: { type: Number, default: 0 },
  totalMessageCount: { type: Number, default: 0 },
  country: { type: String },
  subscription: subscriptionSchema,
  premiumBenefitsEnd: { type: Date, default: null }
});

module.exports = mongoose.model('User', userSchema);
 