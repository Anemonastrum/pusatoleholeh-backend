import mongoose from 'mongoose';

const reviewImageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  url: { type: String, required: true },
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('ReviewImage', reviewImageSchema);
