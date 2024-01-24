const mongoose = require('mongoose');
const { Schema } = mongoose;

const roles = {
  USER: 'user',
  ADMIN: 'assistant'
};

const userSchema = new Schema({
  local: {
    email: { type: String, unique: true, sparse: true },
    password: { type: String }
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
  isEmailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  firstMessageTimestamp: { type: Date },
  messageCount: { type: Number, default: 0 },
  birthday: { type: Date }
});

module.exports = mongoose.model('User', userSchema);
