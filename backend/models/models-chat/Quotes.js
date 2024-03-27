const mongoose = require('mongoose');
const { Schema } = mongoose;

const quotesSchema = new Schema({
  isbn: { type: String, index: true, unique: true },
  bookTitle: { type: String, index: true, unique: true },
  quotes: String
});

module.exports = mongoose.model('Quotes', quotesSchema);

