const mongoose = require('mongoose');
const { Schema } = mongoose;

const keyInsightsSchema = new Schema({
  isbn: { type: String, index: true },
  bookTitle: { type: String, index: true },
  keyInsights: String
});


module.exports = mongoose.model('KeyInsights', keyInsightsSchema);




