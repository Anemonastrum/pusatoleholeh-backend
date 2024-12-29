import mongoose from 'mongoose';

const usageSchema = new mongoose.Schema({
    version: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Usage', usageSchema);