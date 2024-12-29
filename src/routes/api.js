import express from 'express';
import { apiStatus } from '../controllers/api.js';

const router = express.Router();

router.get('/', apiStatus);

export default router;
