const mongoose = require('mongoose');
const { Schema } = mongoose;

const anecdotesSchema = new Schema({
  bookDataObjectId: { type: Schema.Types.ObjectId, index: true, unique: true },
  bookTitle: { type: String, index: true, unique: true },
  anecdotes: String
});

module.exports = mongoose.model('Anecdotes', anecdotesSchema);

