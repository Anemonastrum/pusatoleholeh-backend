import express from 'express';
import {
  getAllVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  toggleVoucherStatus,
} from '../controllers/voucher.js';
import { safeRoute, verifyRole } from '../middlewares/middleware.js';

const router = express.Router();

router.get('/', safeRoute, getAllVouchers);
router.get('/:voucherId', safeRoute, getVoucherById);
router.post('/create', safeRoute, verifyRole('seller'), createVoucher);
router.put('/update/:voucherId', safeRoute, verifyRole('seller'), updateVoucher);
router.delete('/delete/:voucherId', safeRoute, verifyRole('seller'), deleteVoucher);
router.patch('/toggle/:voucherId', safeRoute, verifyRole('seller'), toggleVoucherStatus);

export default router;
