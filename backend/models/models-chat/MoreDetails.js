const mongoose = require('mongoose');
const { Schema } = mongoose;

const moreDetailsSchema = new Schema({
  bookDataObjectId: { type: Schema.Types.ObjectId, index: true, unique: true },
  bookTitle: { type: String, index: true, unique: true },
  detailedDescription: String
});

module.exports = mongoose.model('MoreDetails', moreDetailsSchema);

