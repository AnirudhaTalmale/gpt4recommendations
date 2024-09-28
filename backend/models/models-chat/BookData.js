const mongoose = require('mongoose');
const { Schema } = mongoose;

const countrySchema = new Schema({
  bookImage: String,
  amazonLink: String,
  amazonStarRating: Number,
  amazonReviewCount: String,
  amazonPrice: String,
  amazonDataChecked: { type: Boolean, default: false }  // Default to false
});

const bookSchema = new Schema({
  title: { type: String, required: true, index: true },
  author: { type: String, required: true, index: true },
  previewLink: { type: String, default: '' },
  countrySpecific: {
    IN: countrySchema,
    US: countrySchema,
    GB: countrySchema,
    DE: countrySchema,
    CA: countrySchema,
    FR: countrySchema,
    JP: countrySchema,
    NL: countrySchema,
    SE: countrySchema
  },
  genres: {
    type: [{ type: String, required: true }]
  }
});

// Create a compound index on title and author
bookSchema.index({ title: 1, author: 1 }, { unique: true });

module.exports = mongoose.model('BookData', bookSchema);