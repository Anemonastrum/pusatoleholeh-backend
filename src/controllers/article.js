import Article from '../models/article.js';
import ArticleCover from '../models/articleCover.js';
import ArticleImage from '../models/articleImage.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { validationResult } from 'express-validator';
import { encodeFileName } from '../configs/crypto.js';
import { uploadPathCheck } from '../configs/fs.js';
import { normalizePath, normalizeBaseUrl } from '../configs/normalize.js';

export const createArticle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { productIds, categoryId, title, content } = req.body;
    const userId = req.user.id;

    const article = new Article({
      productIds,
      userId,
      categoryId,
      title,
      content
    });

    await article.save();
    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating article',
      error: error.message
    });
  }
};

export const uploadArticleImage = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {
    const { articleId } = req.params;
    const article = await Article.findOne({ _id: articleId, userId: req.user.id });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    const existingImages = await ArticleImage.find({ articleId: article._id });
    const totalImages = existingImages.length + req.files.length;

    if (totalImages > 5) {
      return res.status(400).json({ message: 'Cannot upload more than 5 images for an article' });
    }

    const uploadPath = path.join(process.env.ARTICLE_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const uploadedImages = [];
    
    for (const file of req.files) {
      const filename = encodeFileName(file.originalname, 'article');
      const outputPath = path.join(uploadPath, filename);

      await sharp(file.buffer).toFormat('webp').toFile(outputPath);

      const normalizedUploadPath = normalizePath(uploadPath);
      const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

      const articleImage = new ArticleImage({
        name: file.originalname,
        path: outputPath,
        url: `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`,
        articleId: article._id,
      });

      await articleImage.save();
      uploadedImages.push(articleImage);
    }

    res.status(200).json({ message: 'Article images uploaded successfully', uploadedImages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteArticleImage = async (req, res) => {
  try {
    const { articleId, articleImageId } = req.params;
    const article = await Article.findOne({ _id: articleId, userId: req.user.id });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const articleImage = await ArticleImage.findOne({ _id: articleImageId, articleId: article._id });
    if (!articleImage) {
      return res.status(404).json({ message: 'Article image not found' });
    }

    if (fs.existsSync(articleImage.path)) {
      fs.unlinkSync(articleImage.path);
    }

    await ArticleImage.deleteOne({ _id: articleImageId });
    res.status(200).json({ message: 'Article image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const uploadArticleCover = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No cover uploaded' });
  }

  try {
    const { articleId } = req.params;
    const article = await Article.findOne({ _id: articleId, userId: req.user.id });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const filename = encodeFileName(req.file.originalname, 'cover');
    const uploadPath = path.join(process.env.ARTICLE_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    const normalizedUploadPath = normalizePath(uploadPath);
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

    const articleCover = new ArticleCover({
      name: req.file.originalname,
      path: outputPath,
      url: `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`,
      articleId: article._id,
    });

    await articleCover.save();
    res.status(200).json({ message: 'Article cover uploaded successfully', articleCover });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateArticleCover = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No cover uploaded' });
  }

  try {
    const { articleId } = req.params;
    const article = await Article.findOne({ _id: articleId, userId: req.user.id });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const existingCover = await ArticleCover.findOne({ articleId: article._id });
    if (existingCover && fs.existsSync(existingCover.path)) {
      fs.unlinkSync(existingCover.path);
    }

    const filename = encodeFileName(req.file.originalname, 'cover');
    const uploadPath = path.join(process.env.ARTICLE_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    const normalizedUploadPath = normalizePath(uploadPath);
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

    if (existingCover) {
      existingCover.name = req.file.originalname;
      existingCover.path = outputPath;
      existingCover.url = `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`;
      await existingCover.save();
      res.status(200).json({ message: 'Article cover updated successfully', articleCover: existingCover });
    } else {
      const articleCover = new ArticleCover({
        name: req.file.originalname,
        path: outputPath,
        url: `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`,
        articleId: article._id,
      });
      await articleCover.save();
      res.status(200).json({ message: 'Article cover created successfully', articleCover });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteArticleCover = async (req, res) => {
  try {
    const { articleId } = req.params;
    const article = await Article.findOne({ _id: articleId, userId: req.user.id });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const articleCover = await ArticleCover.findOne({ articleId: article._id });
    if (!articleCover) {
      return res.status(404).json({ message: 'Article cover not found' });
    }

    if (fs.existsSync(articleCover.path)) {
      fs.unlinkSync(articleCover.path);
    }

    await ArticleCover.deleteOne({ _id: articleCover._id });
    res.status(200).json({ message: 'Article cover deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateArticle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { productIds, categoryId, title, content } = req.body;
    
    const article = await Article.findOne({ _id: id, userId: req.user.id });
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    article.productIds = productIds || article.productIds;
    article.categoryId = categoryId || article.categoryId;
    article.title = title || article.title;
    article.content = content || article.content;
    article.updatedAt = new Date();

    const updatedArticle = await article.save();

    res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      data: updatedArticle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating article',
      error: error.message
    });
  }
};

export const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find()
      .populate('userId', 'name email')
      .populate('categoryId', 'name')
      .populate('productIds', 'name price');

    const articlesWithMedia = await Promise.all(articles.map(async (article) => {
      const cover = await ArticleCover.findOne({ articleId: article._id });
      const images = await ArticleImage.find({ articleId: article._id });
      return {
        ...article._doc,
        cover,
        images
      };
    }));

    res.status(200).json({
      success: true,
      message: 'Articles retrieved successfully',
      data: articlesWithMedia
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving articles',
      error: error.message
    });
  }
};

export const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findById(id)
      .populate('userId', 'name email')
      .populate('categoryId', 'name')
      .populate('productIds', 'name price');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    const cover = await ArticleCover.findOne({ articleId: id });
    const images = await ArticleImage.find({ articleId: id });

    res.status(200).json({
      success: true,
      message: 'Article retrieved successfully',
      data: {
        ...article._doc,
        cover,
        images
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving article',
      error: error.message
    });
  }
};

export const getArticlesByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const articles = await Article.find({ categoryId })
      .populate('userId', 'name email')
      .populate('categoryId', 'name')
      .populate('productIds', 'name price');

    const articlesWithMedia = await Promise.all(articles.map(async (article) => {
      const cover = await ArticleCover.findOne({ articleId: article._id });
      const images = await ArticleImage.find({ articleId: article._id });
      return {
        ...article._doc,
        cover,
        images
      };
    }));

    res.status(200).json({
      success: true,
      message: 'Articles retrieved successfully',
      data: articlesWithMedia
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving articles',
      error: error.message
    });
  }
};

export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findOne({ _id: id, userId: req.user.id });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    const cover = await ArticleCover.findOne({ articleId: id });
    if (cover) {
      if (fs.existsSync(cover.path)) {
        fs.unlinkSync(cover.path);
      }
      await ArticleCover.deleteOne({ _id: cover._id });
    }

    const images = await ArticleImage.find({ articleId: id });
    await Promise.all(images.map(async (image) => {
      if (fs.existsSync(image.path)) {
        fs.unlinkSync(image.path);
      }
      await ArticleImage.deleteOne({ _id: image._id });
    }));

    await Article.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting article',
      error: error.message
    });
  }
};