const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true, maxlength: 100 },
    content: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    predicted_label: { type: String, default: null, index: true },
    confidence: { type: Number, default: null },
    created_at: { type: Date, default: Date.now, index: true }
}, {
    collection: 'comments'
});

CommentSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.model('Comment', CommentSchema);
