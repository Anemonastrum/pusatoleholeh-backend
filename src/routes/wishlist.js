import express from 'express';
import { addProductToWishlist, removeProductFromWishlist, getWishlist } from '../controllers/wishlist.js';
import { safeRoute, verifyRole } from '../middlewares/middleware.js';

const router = express.Router();


router.post('/:productId', safeRoute, addProductToWishlist);
router.delete('/:productId', safeRoute, removeProductFromWishlist);
router.get('/', safeRoute, getWishlist);

export default router;
