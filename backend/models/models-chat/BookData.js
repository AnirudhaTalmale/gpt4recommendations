const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookSchema = new Schema({
  isbn: { type: String, required: true, index: true, unique: true },
  title: { type: String, required: true, index: true, unique: true },
  author: { type: String, required: true },
  bookImage: { type: String, required: true },
  embeddable: { type: Boolean, required: true },
  amazonLink: { type: String, required: true },
  amazonStarRating: { type: Number, default: null },
  amazonReviewCount: { type: String, default: null },
});

module.exports = mongoose.model('BookData', bookSchema);