import express from 'express';
import {
    createTransaction,
    payTransaction,
    processTransaction,
    getTransactionSeller,
    completeTransaction,
    getTransaction
  } from '../controllers/transaction.js';
import { safeRoute, verifyRole } from '../middlewares/middleware.js';

const router = express.Router();

router.post('/', safeRoute, createTransaction);
router.put('/:transactionId/pay/:paymentId', safeRoute, payTransaction);
router.put('/:transactionId/process', safeRoute, processTransaction);
router.get('/seller', safeRoute, getTransactionSeller);
router.put('/:transactionId/complete', safeRoute, completeTransaction);
router.get('/', safeRoute, getTransaction);


export default router;
