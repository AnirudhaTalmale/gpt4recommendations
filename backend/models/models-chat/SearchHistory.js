const mongoose = require('mongoose');
const { Schema } = mongoose;

const searchHistorySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // 'user' field is required
  userName: { type: String, required: true },  // Added 'userName' as required
  bookTitle: { type: String, required: true },  // Added 'bookTitle' as required
  genre: { type: String, required: true },  // 'genre' is already required
  timestamp: { type: Date, default: Date.now, required: true }  // 'timestamp' field is required
});

searchHistorySchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
