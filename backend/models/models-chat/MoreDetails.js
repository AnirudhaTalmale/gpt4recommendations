const mongoose = require('mongoose');
const { Schema } = mongoose;

const moreDetailsSchema = new Schema({
  bookTitle: String,
  author: String,
  detailedDescription: String
});

module.exports = mongoose.model('MoreDetails', moreDetailsSchema);

