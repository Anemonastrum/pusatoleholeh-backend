import express from 'express';
import { updateUser, updateUserImage, uploadUserImage, deleteUserImage, getUser, getUserById, addAddress, updateAddress, deleteAddress, getAddress, addPaymentMethod, addCredit, getPayment } from '../controllers/user.js';
import { safeRoute, checkUserOrigin } from '../middlewares/middleware.js';
import { upload } from '../configs/multer.js';
import { validateUserUpdate } from '../configs/validate.js';

const router = express.Router();

router.put('/update', safeRoute, validateUserUpdate, checkUserOrigin, updateUser);

router.post('/image', safeRoute, upload.single('image'), checkUserOrigin, uploadUserImage);
router.put('/image', safeRoute, upload.single('image'), checkUserOrigin, updateUserImage);
router.delete('/image', safeRoute, checkUserOrigin, deleteUserImage);

router.get('/address', safeRoute, checkUserOrigin, getAddress);
router.post('/address', safeRoute, checkUserOrigin, addAddress);
router.put('/address/:addressId', safeRoute, checkUserOrigin, updateAddress);
router.delete('/address/:addressId', safeRoute, checkUserOrigin, deleteAddress);

router.get('/payment', safeRoute, getPayment);

router.get('/', safeRoute, getUser);
router.get('/:userId', safeRoute, getUserById);

router.post('/payment', safeRoute, addPaymentMethod);
router.post('/payment/:paymentId', safeRoute, addCredit);

export default router;
