import express from 'express';
import { 
  addReview,
  updateReview,
  deleteReview,
  uploadReviewImages,
  deleteReviewImage,
  getProductReviews,
  getUserReviews
} from '../controllers/review.js';
import { safeRoute } from '../middlewares/middleware.js';
import { upload } from '../configs/multer.js';
import { validateReviewCreation, validateReviewUpdate } from '../configs/validate.js';

const router = express.Router();

router.post('/add',
  safeRoute,
  validateReviewCreation,
  addReview
);

router.put('/update/:reviewId',
  safeRoute,
  validateReviewUpdate,
  updateReview
);

router.delete('/delete/:reviewId',
  safeRoute,
  deleteReview
);

router.post('/upload/images/:reviewId',
  safeRoute,
  upload.array('image', 5),
  uploadReviewImages
);

router.delete('/delete/image/:reviewId/:imageId',
  safeRoute,
  deleteReviewImage
);

router.get('/product/:productId', getProductReviews);

router.get('/user',
  safeRoute,
  getUserReviews
);

export default router;
