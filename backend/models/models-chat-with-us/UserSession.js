const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSessionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'ChatWithUsSession', required: true },
    lastSeenMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastSeenAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserSession', userSessionSchema);
