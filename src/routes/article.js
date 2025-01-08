import express from 'express';
import {
  createArticle,
  updateArticle,
  deleteArticle,
  getAllArticles,
  getArticleById,
  uploadArticleImage,
  deleteArticleImage,
  uploadArticleCover,
  updateArticleCover,
  deleteArticleCover,
  getArticlesByCategoryId
} from '../controllers/article.js';
import { safeRoute, verifyRole } from '../middlewares/middleware.js';
import { upload } from '../configs/multer.js';
import { validateArticleCreation } from '../configs/validate.js';

const router = express.Router();

router.post('/create',
  safeRoute,
  verifyRole('admin'),
  validateArticleCreation,
  createArticle
);

router.put('/update/:id',
  safeRoute,
  verifyRole('admin'),
  updateArticle
);

router.delete('/delete/:id',
  safeRoute,
  verifyRole('admin'),
  deleteArticle
);

router.post('/upload/image/:articleId',
  safeRoute,
  verifyRole('admin'),
  upload.array('image', 5),
  uploadArticleImage
);

router.delete('/delete/image/:articleId/:articleImageId',
  safeRoute,
  verifyRole('admin'),
  deleteArticleImage
);

router.post('/upload/cover/:articleId',
  safeRoute,
  verifyRole('admin'),
  upload.single('image'),
  uploadArticleCover
);

router.put('/update/cover/:articleId',
  safeRoute,
  verifyRole('admin'),
  upload.single('image'),
  updateArticleCover
);

router.delete('/delete/cover/:articleId',
  safeRoute,
  verifyRole('admin'),
  deleteArticleCover
);

router.get('/list', getAllArticles);
router.get('/category/:categoryId', getArticlesByCategoryId);
router.get('/:articleId', getArticleById);

export default router;
