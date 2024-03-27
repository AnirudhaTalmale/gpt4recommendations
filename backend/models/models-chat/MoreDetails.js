const mongoose = require('mongoose');
const { Schema } = mongoose;

const moreDetailsSchema = new Schema({
  isbn: { type: String, index: true, unique: true },
  bookTitle: { type: String, index: true, unique: true },
  detailedDescription: String
});

module.exports = mongoose.model('MoreDetails', moreDetailsSchema);

