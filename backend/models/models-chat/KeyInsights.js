const mongoose = require('mongoose');
const { Schema } = mongoose;

const keyInsightsSchema = new Schema({
  bookDataObjectId: { type: Schema.Types.ObjectId, index: true, unique: true },
  bookTitle: { type: String, index: true },
  keyInsights: String,
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('KeyInsights', keyInsightsSchema);




