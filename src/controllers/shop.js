import Shop from '../models/shop.js';
import ShopImage from '../models/shopImage.js';
import ShopBanner from '../models/shopBanner.js';
import Address from '../models/address.js'
import { validationResult } from 'express-validator';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { encodeFileName } from '../configs/crypto.js';
import { uploadPathCheck } from '../configs/fs.js';
import { normalizePath, normalizeBaseUrl } from '../configs/normalize.js';

export const createShop = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      name,
      username,
      description,
      province,
      city,
      district,
      subdistrict,
      postalCode,
    } = req.body;
    const ownerId = req.user._id;

    const formattedUsername = username.startsWith('@') ? username : `@${username}`;

    const shop = new Shop({
      name,
      username: formattedUsername,
      description,
      ownerId,
      address: {
        province,
        city,
        district,
        subdistrict,
        postalCode,
      },
    });

    await shop.save();

    res.status(201).json({ message: 'Shop created successfully', shop });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateShop = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const ownerId = req.user._id;
  const {
    name,
    username,
    description,
    province,
    city,
    district,
    subdistrict,
    postalCode,
  } = req.body;

  try {
    const shop = await Shop.findOne({ ownerId });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Only update fields that are provided in the request
    if (name) shop.name = name;
    if (username) {
      const formattedUsername = username.startsWith('@') ? username : `@${username}`;
      shop.username = formattedUsername;
    }
    if (description) shop.description = description;
    
    // Update address fields only if they are provided
    if (province) shop.address.province = province;
    if (city) shop.address.city = city;
    if (district) shop.address.district = district;
    if (subdistrict) shop.address.subdistrict = subdistrict;
    if (postalCode) shop.address.postalCode = postalCode;

    await shop.save();

    res.status(200).json({ 
      success: true,
      message: 'Shop updated successfully', 
      shop 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const uploadShopImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  const ownerId = req.user._id;

  try {
    const shop = await Shop.findOne({ ownerId });

    const filename = encodeFileName(req.file.originalname, 'shop');
    const uploadPath = path.join(process.env.SHOP_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    const normalizedUploadPath = normalizePath(uploadPath);
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

    const shopImage = new ShopImage({
      name: req.file.originalname,
      path: outputPath,
      url: `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`,
      shopId: shop._id,
    });
    await shopImage.save();

    res.status(200).json({ message: 'Image uploaded successfully', shopImage });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const uploadShopBanner = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No banner uploaded' });
  }

  const ownerId = req.user._id;

  try {
    const shop = await Shop.findOne({ ownerId });

    const filename = encodeFileName(req.file.originalname, 'banner');
    const uploadPath = path.join(process.env.SHOP_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    const normalizedUploadPath = normalizePath(uploadPath);
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

    const shopBanner = new ShopBanner({
      name: req.file.originalname,
      path: outputPath,
      url: `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`,
      shopId: shop._id,
    });
    await shopBanner.save();

    res
      .status(200)
      .json({ message: 'Banner uploaded successfully', shopBanner });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateShopImage = async (req, res) => {

  const ownerId = req.user._id;

  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {

    const shop = await Shop.findOne({ ownerId });
    const shopImage = await ShopImage.findOne({ shopId: shop._id });

    if (!shopImage)
      return res.status(404).json({ message: 'Shop image not found.' });

    if (fs.existsSync(shopImage.path)) {
      fs.unlinkSync(shopImage.path);
    }

    const filename = encodeFileName(req.file.originalname, 'shop');
    const uploadPath = path.join(process.env.SHOP_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    const normalizedUploadPath = normalizePath(uploadPath);
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

    shopImage.name = req.file.originalname;
    shopImage.path = outputPath;
    shopImage.url = `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`;
    await shopImage.save();

    res
      .status(200)
      .json({ message: 'Shop image updated successfully', shopImage });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateShopBanner = async (req, res) => {

  const ownerId = req.user._id;

  if (!req.file) {
    return res.status(400).json({ message: 'No banner uploaded' });
  }

  try {

    const shop = await Shop.findOne({ ownerId });
    const shopBanner = await ShopBanner.findOne({ shopId: shop._id });

    if (!shopBanner)
      return res.status(404).json({ message: 'Shop banner not found.' });

    if (fs.existsSync(shopBanner.path)) {
      fs.unlinkSync(shopBanner.path);
    }

    const filename = encodeFileName(req.file.originalname, 'banner');
    const uploadPath = path.join(process.env.SHOP_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    const normalizedUploadPath = normalizePath(uploadPath);
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

    shopBanner.name = req.file.originalname;
    shopBanner.path = outputPath;
    shopBanner.url = `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`;
    await shopBanner.save();

    res
      .status(200)
      .json({ message: 'Shop banner updated successfully', shopBanner });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteShopImage = async (req, res) => {
  
  const ownerId = req.user._id;

  try {

    const shop = await Shop.findOne({ ownerId });
    const shopImage = await ShopImage.findOne({ shopId: shop._id });

    if (!shopImage)
      return res.status(404).json({ message: 'Shop image not found.' });

    if (fs.existsSync(shopImage.path)) {
      fs.unlinkSync(shopImage.path);
    }

    await ShopImage.deleteOne({ _id: shopImage._id });

    res.status(200).json({ message: 'Shop image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteShopBanner = async (req, res) => {
  
  const ownerId = req.user._id;

  try {

    const shop = await Shop.findOne({ ownerId });
    const shopBanner = await ShopBanner.findOne({ shopId: shop._id });

    if (!shopBanner)
      return res.status(404).json({ message: 'Shop banner not found.' });

    if (fs.existsSync(shopBanner.path)) {
      fs.unlinkSync(shopBanner.path);
    }

    await ShopBanner.deleteOne({ _id: shopBanner._id });

    res.status(200).json({ message: 'Shop banner deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getShopInfo = async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found for the logged-in user' });
    }

    const shopImage = await ShopImage.findOne({ shopId: shop._id }).select('url');
    const shopBanner = await ShopBanner.findOne({ shopId: shop._id }).select('url');

    res.status(200).json({
      message: 'Shop information retrieved successfully',
      shop,
      shopImage: shopImage ? shopImage.url : null,
      shopBanner: shopBanner ? shopBanner.url : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find();
    res.status(200).json({ message: 'Shops retrieved successfully', shops });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getShopById = async (req, res) => {
  const { shopId } = req.params;

  try {
    const shop = await Shop.findById(shopId).populate('ownerId', 'name');

    const shopImage = await ShopImage.find({ shopId: shop._id });
    const shopBanner = await ShopBanner.find({ shopId: shop._id });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res
      .status(200)
      .json({
        message: 'Shop found!',
        shop,
        image: shopImage,
        banner: shopBanner,
      });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getShopByName = async (req, res) => {
  const { shopName } = req.params;

  try {
    const shop = await Shop.findOne({ username: shopName }).populate('ownerId', 'name');

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const shopImage = await ShopImage.find({ shopId: shop._id });
    const shopBanner = await ShopBanner.find({ shopId: shop._id });

    res.status(200).json({
      message: 'Shop found!',
      shop,
      image: shopImage,
      banner: shopBanner,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};