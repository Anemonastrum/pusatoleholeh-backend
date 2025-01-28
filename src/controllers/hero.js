import HeroBanner from '../models/heroBanner.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { encodeFileName } from '../configs/crypto.js';
import { uploadPathCheck } from '../configs/fs.js';
import { normalizePath, normalizeBaseUrl } from '../configs/normalize.js';
import mongoose from 'mongoose';

export const uploadHeroBanner = async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No banner uploaded' });
    }
  
    try {
  
      const filename = encodeFileName(req.file.originalname, 'banner');
      const uploadPath = path.join(process.env.HERO_UPLOAD_PATH);
      const baseUrl = path.join(process.env.CDN_BASE_URL);
  
      uploadPathCheck(uploadPath);
  
      const outputPath = path.join(uploadPath, filename);
  
      await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

      const normalizedUploadPath = normalizePath(uploadPath);
      const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  
      const heroBanner = new HeroBanner({
        name: req.file.originalname,
        path: outputPath,
        url: `${normalizedBaseUrl}:${process.env.CDN_PORT}/${normalizedUploadPath}/${filename}`,
      });
      await heroBanner.save();
  
      res
        .status(200)
        .json({ message: 'Banner uploaded successfully', heroBanner });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const updateHeroBanner = async (req, res) => {

  const heroBannerId = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {

    const heroBanner = await HeroBanner.findOne({ _id: heroBannerId });

    if (!heroBanner)
      return res.status(404).json({ message: 'Image not found.' });

    if (fs.existsSync(heroBanner.path)) {
      fs.unlinkSync(heroBanner.path);
    }

    const filename = encodeFileName(req.file.originalname, 'banner');
    const uploadPath = path.join(process.env.HERO_UPLOAD_PATH);
    const baseUrl = path.join(process.env.CDN_BASE_URL);

    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    heroBanner.path = outputPath;
    heroBanner.url = `${baseUrl}:${process.env.CDN_PORT}/${uploadPath}/${filename}`;
    await heroBanner.save();

    res
      .status(200)
      .json({ message: 'Banner image updated successfully', heroBanner });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteHeroBanner = async (req, res) => {
  try {
    const { heroBannerId } = req.params;
    
    // Validasi ID
    if (!mongoose.Types.ObjectId.isValid(heroBannerId)) {
      return res.status(400).json({ 
        message: 'Invalid banner ID format' 
      });
    }

    // Cari banner yang akan dihapus
    const banner = await HeroBanner.findById(heroBannerId);
    
    if (!banner) {
      return res.status(404).json({ 
        message: 'Banner not found' 
      });
    }

    // Hapus file gambar dari storage
    if (banner.path) {
      const filePath = path.join('public', banner.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Hapus data banner dari database
    await HeroBanner.findByIdAndDelete(heroBannerId);

    res.status(200).json({ 
      message: 'Banner deleted successfully' 
    });

  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ 
      message: 'Failed to delete banner',
      error: error.message 
    });
  }
};

export const getBanner = async (req, res) => {
  try {
    const heroBanners = await HeroBanner.find();

    if (!heroBanners.length) {
      return res.status(404).json({ message: 'No banners found' });
    }

    res.status(200).json({
      message: 'Banners retrieved successfully',
      banners: heroBanners,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};