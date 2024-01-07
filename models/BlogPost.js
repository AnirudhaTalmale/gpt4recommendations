//BlogPost model
const mongoose = require('mongoose');
const { Schema } = mongoose;

const blogPostSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String }, // Base64 string or URL of the image
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
