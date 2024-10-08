import express from 'express';
import { createShop } from '../controllers/shop.js';
import { ruteAman, verifyRole } from '../middlewares/auth.js';

const router = express.Router();

router.post('/create', ruteAman, verifyRole('seller'), createShop);

export default router;
