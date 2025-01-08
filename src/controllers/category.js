import Category from '../models/category.js';
import CategoryImage from '../models/categoryImage.js';
import Product from '../models/product.js';
import ProductImage from '../models/productImage.js';
import ProductCover from '../models/productCover.js';
import { validationResult } from 'express-validator';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { encodeFileName } from '../configs/crypto.js';
import { uploadPathCheck } from '../configs/fs.js';
import { normalizePath, normalizeBaseUrl } from '../configs/normalize.js';

export const addCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description } = req.body;

    const category = new Category({ name, description });
    await category.save();

    res.status(201).json({ message: 'Category added successfully', category });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const uploadCategoryImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const existingImage = await CategoryImage.findOne({ categoryId: category._id });
    if (existingImage && fs.existsSync(existingImage.path)) {
      fs.unlinkSync(existingImage.path);
      await CategoryImage.deleteOne({ _id: existingImage._id });
    }

    const filename = encodeFileName(req.file.originalname, 'category');
    const uploadPath = path.join(process.env.CATEGORY_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    const normalizedUploadPath = normalizePath(uploadPath);
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

    const categoryImage = new CategoryImage({
      name: req.file.originalname,
      path: outputPath,
      url: `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`,
      categoryId: category._id,
    });

    await categoryImage.save();
    res.status(200).json({ message: 'Category image uploaded successfully', categoryImage });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateCategoryImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const existingImage = await CategoryImage.findOne({ categoryId: category._id });
    if (existingImage && fs.existsSync(existingImage.path)) {
      fs.unlinkSync(existingImage.path);
    }

    const filename = encodeFileName(req.file.originalname, 'category');
    const uploadPath = path.join(process.env.CATEGORY_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    const normalizedUploadPath = normalizePath(uploadPath);
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

    if (existingImage) {
      existingImage.name = req.file.originalname;
      existingImage.path = outputPath;
      existingImage.url = `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`;
      await existingImage.save();
      res.status(200).json({ message: 'Category image updated successfully', categoryImage: existingImage });
    } else {
      const categoryImage = new CategoryImage({
        name: req.file.originalname,
        path: outputPath,
        url: `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`,
        categoryId: category._id,
      });
      await categoryImage.save();
      res.status(200).json({ message: 'Category image created successfully', categoryImage });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteCategoryImage = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const categoryImage = await CategoryImage.findOne({ categoryId: category._id });
    if (!categoryImage) {
      return res.status(404).json({ message: 'Category image not found' });
    }

    if (fs.existsSync(categoryImage.path)) {
      fs.unlinkSync(categoryImage.path);
    }

    await CategoryImage.deleteOne({ _id: categoryImage._id });
    res.status(200).json({ message: 'Category image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { name, description, updatedAt: Date.now() },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category updated successfully', category });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const categoryImage = await CategoryImage.findOne({ categoryId });
    if (categoryImage) {
      if (fs.existsSync(categoryImage.path)) {
        fs.unlinkSync(categoryImage.path);
      }
      await CategoryImage.deleteOne({ _id: categoryImage._id });
    }

    await Category.deleteOne({ _id: categoryId });
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getCategory = async (req, res) => {
  try {
    const categories = await Category.find();
    
    const categoriesWithImages = await Promise.all(categories.map(async (category) => {
      const image = await CategoryImage.findOne({ categoryId: category._id });
      return {
        ...category._doc,
        image
      };
    }));

    res.status(200).json({ 
      message: 'Categories retrieved successfully', 
      categories: categoriesWithImages 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const products = await Product.find({ categoryId, isActive: true })
      .populate({
        path: 'categoryId',
        select: 'name description',
      })
      .populate({
        path: 'shopId',
        select: 'name address',
      })
      .lean();

    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const productCover = await ProductCover.findOne({ productId: product._id }).select('url');
        const productImages = await ProductImage.find({ productId: product._id }).select('url');

        return {
          ...product,
          cover: productCover,
          images: productImages,
        };
      })
    );

    res.status(200).json({
      message: 'Products retrieved successfully',
      category,
      products: productsWithImages,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
