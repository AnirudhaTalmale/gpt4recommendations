const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookSchema = new Schema({
  title: { type: String, required: true, index: true, unique: true },
  author: { type: String, required: true, index: true},
  previewLink: { type: String, default: '' },
  countrySpecific: {
    IN: {
      bookImage: String,
      amazonLink: String,
      amazonStarRating: Number,
      amazonReviewCount: String
    },
    US: {
      bookImage: String,
      amazonLink: String,
      amazonStarRating: Number,
      amazonReviewCount: String
    }
  },
  genres: [{ type: String, required: true }]
});

module.exports = mongoose.model('BookData', bookSchema);