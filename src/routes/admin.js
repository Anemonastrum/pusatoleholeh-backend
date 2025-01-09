import express from 'express';
import { getUsersByRole, getAllShops, toggleUserBan } from '../controllers/admin.js';
import { safeRoute, verifyRole } from '../middlewares/middleware.js';

const router = express.Router();

router.get('/users/:role', safeRoute, verifyRole('admin'), getUsersByRole);
router.get('/shops', safeRoute, verifyRole('admin'), getAllShops);
router.patch('/users/:userId/toggle-ban', safeRoute, verifyRole('admin'), toggleUserBan);

export default router;
