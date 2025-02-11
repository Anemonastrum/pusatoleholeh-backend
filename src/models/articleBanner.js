import mongoose from 'mongoose';

const articleBannerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  url: { type: String, required: true },
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('ArticleBanner', articleBannerSchema);
