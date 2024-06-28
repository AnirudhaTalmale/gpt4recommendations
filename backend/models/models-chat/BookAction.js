const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookActionSchema = new Schema({
  buttonClassName: { type: String, required: true },
  title: { type: String },
  author: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BookAction', bookActionSchema);
