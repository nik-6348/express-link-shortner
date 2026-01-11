import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const linkSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true,
    },
    shortCode: {
        type: String,
        required: true,
        unique: true,
        default: () => nanoid(6), // Auto-generate 6 char code
    },
    favicon: {
        type: String,
        default: '',
    },
    title: {
        type: String,
        default: '',
    },
    clicks: {
        type: Number,
        default: 0,
    },
    lastAccessed: {
        type: Date,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true
});

const Link = mongoose.model('Link', linkSchema);

export default Link;
