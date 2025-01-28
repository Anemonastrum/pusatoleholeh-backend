import Review from '../models/review.js';
import ReviewImage from '../models/reviewImage.js';
import Transaction from '../models/transaction.js';
import TransactionStatus from '../models/transactionStatus.js';
import { validationResult } from 'express-validator';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { encodeFileName } from '../configs/crypto.js';
import { uploadPathCheck } from '../configs/fs.js';
import { normalizePath, normalizeBaseUrl } from '../configs/normalize.js';

export const addReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { productId, transactionId, rating, comment } = req.body;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId
    });

    if (!transaction) {
      return res.status(404).json({ 
        message: 'Transaction not found' 
      });
    }

    const transactionStatus = await TransactionStatus.findOne({
      transactionId: transaction._id
    });

    if (!transactionStatus || transactionStatus.status !== 'Completed') {
      return res.status(400).json({ 
        message: 'Transaction is not completed' 
      });
    }

    const existingReview = await Review.findOne({
      userId,
      productId,
      transactionId
    });

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this product for this transaction' 
      });
    }

    const review = new Review({
      userId,
      productId,
      transactionId,
      rating,
      comment
    });

    await review.save();

    res.status(201).json({ 
      message: 'Review added successfully', 
      review 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

export const updateReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.updatedAt = new Date();

    await review.save();

    res.status(200).json({ 
      message: 'Review updated successfully', 
      review 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const reviewImages = await ReviewImage.find({ reviewId });
    await Promise.all(reviewImages.map(async (image) => {
      if (fs.existsSync(image.path)) {
        fs.unlinkSync(image.path);
      }
      await ReviewImage.deleteOne({ _id: image._id });
    }));

    await Review.deleteOne({ _id: reviewId });

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

export const uploadReviewImages = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No images uploaded' });
  }

  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const existingImages = await ReviewImage.find({ reviewId });
    const totalImages = existingImages.length + req.files.length;

    if (totalImages > 5) {
      return res.status(400).json({ message: 'Cannot upload more than 5 images for a review' });
    }

    const uploadPath = path.join(process.env.REVIEW_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const uploadedImages = [];

    for (const file of req.files) {
      const filename = encodeFileName(file.originalname, 'review');
      const outputPath = path.join(uploadPath, filename);

      await sharp(file.buffer).toFormat('webp').toFile(outputPath);

      const normalizedUploadPath = normalizePath(uploadPath);
      const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

      const reviewImage = new ReviewImage({
        name: file.originalname,
        path: outputPath,
        url: `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`,
        reviewId: review._id
      });

      await reviewImage.save();
      uploadedImages.push(reviewImage);
    }

    res.status(200).json({ 
      message: 'Review images uploaded successfully', 
      images: uploadedImages 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

export const deleteReviewImage = async (req, res) => {
  try {
    const { reviewId, imageId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const reviewImage = await ReviewImage.findOne({ 
      _id: imageId, 
      reviewId 
    });
    
    if (!reviewImage) {
      return res.status(404).json({ message: 'Review image not found' });
    }

    if (fs.existsSync(reviewImage.path)) {
      fs.unlinkSync(reviewImage.path);
    }

    await ReviewImage.deleteOne({ _id: imageId });

    res.status(200).json({ message: 'Review image deleted successfully' });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    const reviewsWithImages = await Promise.all(reviews.map(async (review) => {
      const images = await ReviewImage.find({ reviewId: review._id });
      return {
        ...review._doc,
        images
      };
    }));

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    res.status(200).json({
      message: 'Reviews retrieved successfully',
      averageRating,
      totalReviews: reviews.length,
      reviews: reviewsWithImages
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const reviews = await Review.find({ userId })
      .populate('productId', 'name price')
      .sort({ createdAt: -1 });

    const reviewsWithImages = await Promise.all(reviews.map(async (review) => {
      const images = await ReviewImage.find({ reviewId: review._id });
      return {
        ...review._doc,
        images
      };
    }));

    res.status(200).json({
      message: 'User reviews retrieved successfully',
      reviews: reviewsWithImages
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};
