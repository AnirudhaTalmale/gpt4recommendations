const mongoose = require('mongoose');
const { Schema } = mongoose;

const anecdotesSchema = new Schema({
  bookDataObjectId: { type: Schema.Types.ObjectId, index: true, unique: true },
  bookTitle: { type: String, index: true },
  anecdotes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Anecdotes', anecdotesSchema);

