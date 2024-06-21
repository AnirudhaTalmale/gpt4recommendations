const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookSchema = new Schema({
  title: { type: String, required: true, index: true },
  author: { type: String, required: true, index: true },
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
  genres: {
    type: [{ type: String, required: true }],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one genre must be specified'
    }
  }
});

// Create a compound index on title and author
bookSchema.index({ title: 1, author: 1 }, { unique: true });

module.exports = mongoose.model('BookData', bookSchema);