import Product from '../models/product.js';
import ProductImage from '../models/productImage.js';
import ProductCover from '../models/productCover.js';
import Shop from '../models/shop.js';
import ShopImage from '../models/shopImage.js';
import ShopBanner from '../models/shopBanner.js';
import Category from '../models/category.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { validationResult } from 'express-validator';
import { encodeFileName } from '../configs/crypto.js';
import { uploadPathCheck } from '../configs/fs.js';
import { normalizePath, normalizeBaseUrl } from '../configs/normalize.js';

export const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, price, stock, categoryId } = req.body;

    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const product = new Product({
      name,
      description,
      price,
      stock,
      categoryId,
      shopId: shop._id,
    });

    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { productId } = req.params;
    const { name, description, price, stock, categoryId } = req.body;
    const shop = await Shop.findOne({ ownerId: req.user._id });

    const product = await Product.findOne({ _id: productId, shopId: shop._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      product.categoryId = categoryId;
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock || product.stock;

    await product.save();
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });

    const product = await Product.findOne({ _id: productId, shopId: shop._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.deleteOne({ _id: productId });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const activateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const product = await Product.findOne({ _id: productId, shopId: shop._id });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = true;
    await product.save();

    res.status(200).json({ message: 'Product activated successfully', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deactivateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const product = await Product.findOne({ _id: productId, shopId: shop._id });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = false;
    await product.save();

    res.status(200).json({ message: 'Product activated successfully', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const uploadProductImage = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });
    const product = await Product.findOne({ _id: productId, shopId: shop._id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const existingImages = await ProductImage.find({ productId: product._id });
    const totalImages = existingImages.length + req.files.length;

    if (totalImages > 5) {
      return res.status(400).json({ message: 'Cannot upload more than 5 images for a product' });
    }

    const uploadPath = path.join(process.env.PRODUCT_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const uploadedImages = [];
    
    for (const file of req.files) {
      const filename = encodeFileName(file.originalname, 'product');
      const outputPath = path.join(uploadPath, filename);

      await sharp(file.buffer).toFormat('webp').toFile(outputPath);

      const normalizedUploadPath = normalizePath(uploadPath);
      const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

      const productImage = new ProductImage({
        name: file.originalname,
        path: outputPath,
        url: `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`,
        productId: product._id,
      });

      await productImage.save();
      uploadedImages.push(productImage);
    }

    res.status(200).json({ message: 'Product image uploaded successfully', uploadedImages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const { productId, productImageId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });
    const product = await Product.findOne({ _id: productId, shopId: shop._id });

    const productImage = await ProductImage.findOne({ productId: product._id });
    if (!productImage) {
      return res.status(404).json({ message: 'Product image not found' });
    }

    if (fs.existsSync(productImage.path)) {
      fs.unlinkSync(productImage.path);
    }

    await ProductImage.deleteOne({ _id: productImageId });
    res.status(200).json({ message: 'Product image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const uploadProductCover = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No cover uploaded' });
  }

  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });
    const product = await Product.findOne({ _id: productId, shopId: shop._id });

    const filename = encodeFileName(req.file.originalname, 'cover');
    const uploadPath = path.join(process.env.PRODUCT_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    const normalizedUploadPath = normalizePath(uploadPath);
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

    const productCover = new ProductCover({
      name: req.file.originalname,
      path: outputPath,
      url: `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`,
      productId: product._id,
    });

    await productCover.save();
    res.status(200).json({ message: 'Product cover uploaded successfully', productCover });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateProductCover = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No cover uploaded' });
  }

  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });
    const product = await Product.findOne({ _id: productId, shopId: shop._id });

    const productCover = await ProductCover.findOne({ productId: product._id });
    if (!productCover) {
      return res.status(404).json({ message: 'Product cover not found' });
    }

    if (fs.existsSync(productCover.path)) {
      fs.unlinkSync(productCover.path);
    }

    const filename = encodeFileName(req.file.originalname, 'cover');
    const uploadPath = path.join(process.env.PRODUCT_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    const normalizedUploadPath = normalizePath(uploadPath);
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

    productCover.name = req.file.originalname;
    productCover.path = outputPath;
    productCover.url = `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`;
    await productCover.save();

    res.status(200).json({ message: 'Product cover updated successfully', productCover });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteProductCover = async (req, res) => {
  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });
    const product = await Product.findOne({ _id: productId, shopId: shop._id });

    const productCover = await ProductCover.findOne({ productId: product._id });
    if (!productCover) {
      return res.status(404).json({ message: 'Product cover not found' });
    }

    if (fs.existsSync(productCover.path)) {
      fs.unlinkSync(productCover.path);
    }

    await ProductCover.deleteOne({ _id: productCover._id });
    res.status(200).json({ message: 'Product cover deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getAllOwnedProducts = async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found for the logged-in user' });
    }

    const products = await Product.find({ shopId: shop._id })
      .populate({
        path: 'categoryId',
        select: 'name description',
      })
      .lean();

    if (!products.length) {
      return res.status(404).json({ message: 'No products found for this shop' });
    }

    const productsWithCover = await Promise.all(
      products.map(async (product) => {
        const productCover = await ProductCover.findOne({ productId: product._id }).select('url');
        const productImages = await ProductImage.find({ productId: product._id });

        return {
          ...product,
          productCover: productCover ? productCover.url : null,
          productImages: productImages.map(img => ({
            id: img._id,
            url: img.url,
          })),
        };
      })
    );

    res.status(200).json(productsWithCover);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getProductById = async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId)
      .populate('categoryId', 'name')
      .populate('shopId', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const coverImage = await ProductCover.findOne({ productId });
    
    const additionalImages = await ProductImage.find({ productId });

    res.status(200).json({
      product,
      coverImage: coverImage ? coverImage.url : null, 
      productImages: additionalImages.map(img => ({
        id: img._id,
        url: img.url,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getProductsByShopId = async (req, res) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'No such shop available' });
    }

    const products = await Product.find({ shopId, isActive: true })
      .populate({
        path: 'categoryId',
        select: 'name description',
      })
      .lean();

    const shopImages = await ShopImage.find({ shopId });
    const shopBanner = await ShopBanner.find({ shopId });

    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const productCover = await ProductCover.findOne({ productId: product._id }).select('url');
        const productImages = await ProductImage.find({ productId: product._id }).select('url');

        return {
          ...product,
          productCover: productCover ? productCover.url : null
        };
      })
    );

    res.status(200).json(productsWithImages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};