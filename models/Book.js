const mongoose = require('mongoose');
const { Schema } = mongoose;

// Book Schema
const bookSchema = new Schema({
  title: { type: String, required: true },
  coverImageUrl: { type: String, required: true },
  isbn: { type: String, required: true }, // Set as required
});

module.exports = mongoose.model('Book', bookSchema);
