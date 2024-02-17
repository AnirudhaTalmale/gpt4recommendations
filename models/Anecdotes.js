const mongoose = require('mongoose');
const { Schema } = mongoose;

const anecdotesSchema = new Schema({
  bookTitle: String,
  author: String,
  anecdotes: String
});

module.exports = mongoose.model('Anecdotes', anecdotesSchema);




