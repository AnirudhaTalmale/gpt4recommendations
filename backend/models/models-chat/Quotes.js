const mongoose = require('mongoose');
const { Schema } = mongoose;

const quotesSchema = new Schema({
  bookDataObjectId: { type: Schema.Types.ObjectId, index: true, unique: true },
  bookTitle: { type: String, index: true, unique: true },
  quotes: String
});

module.exports = mongoose.model('Quotes', quotesSchema);

