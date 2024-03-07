const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  amazonLink: { type: String, required: true },
  amazonStarRating: { type: Number, default: null },
  amazonReviewCount: { type: String, default: null },
  amazonImage: { type: String, default: null },
});

module.exports = mongoose.model('AmazonBookData', bookSchema);
