import express from 'express';
import {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  deleteAllAlerts, 
  toggleAlertStatus,
  markAlertAsRead,
} from '../controllers/alert.js';
import { safeRoute, verifyRole } from '../middlewares/middleware.js';

const router = express.Router();

router.get('/', safeRoute, verifyRole('admin'), getAlerts);
router.post('/create', safeRoute, verifyRole('admin'), createAlert);
router.put('/update/:alertId', safeRoute, verifyRole('admin'), updateAlert);
router.delete('/delete/:alertId', safeRoute, verifyRole('admin'), deleteAlert);
router.delete('/delete-all', safeRoute, verifyRole('admin'), deleteAllAlerts); 
router.patch('/toggle/:alertId', safeRoute, verifyRole('admin'), toggleAlertStatus);
router.put('/mark-read/:alertId', safeRoute, markAlertAsRead);

export default router;
