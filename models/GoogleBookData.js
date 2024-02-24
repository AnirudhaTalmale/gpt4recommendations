const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  googleImage: { type: String, required: true },
  isbn: { type: String, required: true },
  embeddable: { type: Boolean, required: true },
});

module.exports = mongoose.model('GoogleBookData', bookSchema);
