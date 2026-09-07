const mongoose = require ('mongoose');

const resumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rawText: {
        type: String,
    },
    parsedData: {
        type: Object,
        default: {},
    },
    profileImageUrl: {
        type: String,
        default: null,
    },
    theme: {
        type: String,
        default: 'default',
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    viewCount: {
        type: Number,
        default: 0,
    },
    likeBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);