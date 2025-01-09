import express from 'express';
import { apiStatus, getServerStatus } from '../controllers/api.js';
import { safeRoute, verifyRole } from '../middlewares/middleware.js';

const router = express.Router();

router.get('/', apiStatus);
router.get('/status', safeRoute, verifyRole('admin'), getServerStatus);

export default router;
