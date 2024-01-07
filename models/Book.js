const mongoose = require('mongoose');
const { Schema } = mongoose;

// Book Schema
const bookSchema = new Schema({
  title: { type: String, required: true },
  coverImageUrl: { type: String, required: true }
});

module.exports = mongoose.model('Book', bookSchema);
