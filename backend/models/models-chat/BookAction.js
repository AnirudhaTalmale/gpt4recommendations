const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookActionSchema = new Schema({
    buttonClassName: { type: String, required: true },
    title: { type: String, required: true },
    author: { type: String },
    userEmail: { type: String, required: true },  // Add userEmail field
    createdAt: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('BookAction', bookActionSchema);
  