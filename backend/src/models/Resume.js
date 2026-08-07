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
    theme: {
        type: String,
        default: 'default',
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);