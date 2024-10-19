import express from 'express';
import { safeRoute, checkShopOwner } from '../middlewares/middleware.js';
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProductById 
} from '../controllers/product.js';
import { 
  validateProductInput, 
  upload, 
  processImages, 
  checkProductExistence 
} from '../middlewares/productMiddleware.js';

const router = express.Router();

router.post('/:shopId/create', 
  safeRoute, 
  checkShopOwner, 
  upload.array('images', 5), 
  validateProductInput, 
  processImages, 
  createProduct
);

router.put('/:productId', 
  safeRoute, 
  checkProductExistence, 
  checkShopOwner, 
  updateProduct
);

router.delete('/:productId', 
  safeRoute, 
  checkProductExistence, 
  checkShopOwner, 
  deleteProduct
);

router.get('/:productId', 
  safeRoute, 
  checkProductExistence, 
  getProductById
);

export default router;
