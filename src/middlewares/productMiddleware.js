import { body, validationResult } from 'express-validator';
import Product from '../models/product.js';
import Shop from '../models/shop.js';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';

// Middleware for product validation
export const validateProductInput = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a valid number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a valid number'),
  body('category').notEmpty().withMessage('Category is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Middleware for uploading and processing images
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5 MB per image
});

export const processImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'At least one image is required.' });
  }

  req.body.images = [];

  for (const file of req.files) {
    const imageName = `${Date.now()}-${file.originalname.split(' ').join('-')}`;
    const imagePath = path.resolve(`uploads/products/${imageName}`);
    const imageUrl = `/uploads/products/${imageName}`;

    // Convert to webp using sharp
    await sharp(file.buffer)
      .resize(500)
      .toFormat('webp')
      .toFile(imagePath);

    req.body.images.push({ name: file.originalname, path: imagePath, url: imageUrl });
  }

  next();
};

// Middleware to validate product existence
export const checkProductExistence = async (req, res, next) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  req.product = product;
  next();
};
