import express from 'express';
import { 
  addCategory, 
  updateCategory, 
  deleteCategory, 
  getCategory, 
  getProductsByCategory,
  uploadCategoryImage,
  updateCategoryImage,
  deleteCategoryImage
} from '../controllers/category.js';
import { validateCategoryId, validateAddCategory, validateUpdateCategory } from '../configs/validate.js';
import { safeRoute, verifyRole } from '../middlewares/middleware.js';
import { upload } from '../configs/multer.js';

const router = express.Router();

router.post('/add', 
  validateAddCategory, 
  safeRoute, 
  verifyRole('admin'), 
  addCategory
);

router.put('/update/:categoryId', 
  validateUpdateCategory, 
  safeRoute, 
  verifyRole('admin'), 
  updateCategory
);

router.delete('/delete/:categoryId', 
  validateCategoryId, 
  safeRoute, 
  verifyRole('admin'), 
  deleteCategory
);

router.post('/upload/image/:categoryId',
  safeRoute,
  verifyRole('admin'),
  upload.single('image'),
  uploadCategoryImage
);

router.put('/update/image/:categoryId',
  safeRoute,
  verifyRole('admin'),
  upload.single('image'),
  updateCategoryImage
);

router.delete('/delete/image/:categoryId',
  safeRoute,
  verifyRole('admin'),
  deleteCategoryImage
);

router.get('/', getCategory);
router.get('/:categoryId', getProductsByCategory);

export default router;
