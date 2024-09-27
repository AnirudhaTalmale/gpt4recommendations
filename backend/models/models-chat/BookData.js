const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookSchema = new Schema({
  title: { type: String, required: true, index: true },
  author: { type: String, required: true, index: true },
  previewLink: { type: String, default: '' },
  countrySpecific: {
    IN: {  // India
          bookImage: String,
          amazonLink: String,
          amazonStarRating: Number,
          amazonReviewCount: String,
          amazonPrice: String
        },
        US: {  // United States
          bookImage: String,
          amazonLink: String,
          amazonStarRating: Number,
          amazonReviewCount: String,
          amazonPrice: String
        },
        GB: {  // United Kingdom
          bookImage: String,
          amazonLink: String,
          amazonStarRating: Number,
          amazonReviewCount: String,
          amazonPrice: String
        },
        DE: {  // Germany
          bookImage: String,
          amazonLink: String,
          amazonStarRating: Number,
          amazonReviewCount: String,
          amazonPrice: String
        },
        CA: {  // Canada
          bookImage: String,
          amazonLink: String,
          amazonStarRating: Number,
          amazonReviewCount: String,
          amazonPrice: String
        },
        FR: {  // France
          bookImage: String,
          amazonLink: String,
          amazonStarRating: Number,
          amazonReviewCount: String,
          amazonPrice: String
        },
        JP: {  // Japan
          bookImage: String,
          amazonLink: String,
          amazonStarRating: Number,
          amazonReviewCount: String,
          amazonPrice: String
        },
        NL: {  // Netherlands
          bookImage: String,
          amazonLink: String,
          amazonStarRating: Number,
          amazonReviewCount: String,
          amazonPrice: String
        },
        SE: {  // Sweden
          bookImage: String,
          amazonLink: String,
          amazonStarRating: Number,
          amazonReviewCount: String,
          amazonPrice: String
        }        
    },
    
  genres: {
    type: [{ type: String, required: true }]
  }
});

// Create a compound index on title and author
bookSchema.index({ title: 1, author: 1 }, { unique: true });

module.exports = mongoose.model('BookData', bookSchema);