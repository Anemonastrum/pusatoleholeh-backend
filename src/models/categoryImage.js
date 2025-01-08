import mongoose from 'mongoose';

const categoryImageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  url: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('CategoryImage', categoryImageSchema);
