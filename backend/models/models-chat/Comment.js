const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define a reply schema for comments, now including user references for likes and dislikes
const replySchema = new Schema({
  text: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who liked the reply
  dislikes: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who disliked the reply
});

// Define the main comment schema, now with arrays of user IDs for likes and dislikes
const commentSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: 'BookData', required: true },
  text: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  replies: [replySchema],
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who liked the comment
  dislikes: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who disliked the comment
});

module.exports = mongoose.model('Comment', commentSchema);
