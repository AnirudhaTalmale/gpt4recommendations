const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookLikeSchema = new Schema({
    book: { type: Schema.Types.ObjectId, ref: 'BookData', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    like: { type: Boolean } // No longer strictly required, allow null
}, {
    timestamps: true
});

module.exports = mongoose.model('BookLike', bookLikeSchema);
