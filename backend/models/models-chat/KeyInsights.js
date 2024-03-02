const mongoose = require('mongoose');
const { Schema } = mongoose;

const keyInsightsSchema = new Schema({
  bookTitle: String,
  author: String,
  keyInsights: String
});

module.exports = mongoose.model('KeyInsights', keyInsightsSchema);




