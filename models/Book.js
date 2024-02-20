const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookSchema = new Schema({
  title: { type: String, required: true },
  coverImageUrl: { type: String, required: true },
  isbn: { type: String, required: true },
  embeddable: { type: Boolean, required: true },
  amazonLink: { type: String, required: true },
  amazonStarRating: { type: Number, default: null },
  amazonReviewCount: { type: String, default: null },
});

module.exports = mongoose.model('Book', bookSchema);
