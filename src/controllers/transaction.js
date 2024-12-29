import PaymentMethod from '../models/paymentMethod.js';
import Shop from '../models/shop.js';
import Voucher from '../models/voucher.js';
import Product from '../models/product.js';
import Transaction from '../models/transaction.js';
import TransactionStatus from '../models/transactionStatus.js';
import { validationResult } from 'express-validator';

export const createTransaction = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { shopId, paymentId, voucherId, courierId, addressId, products, note } = req.body;
  const userId = req.user._id;

  try {
    const productIds = products.map(product => product.productId);
    const productRecords = await Product.find({ '_id': { $in: productIds } });

    if (productRecords.length !== products.length) {
      return res.status(404).json({ message: 'One or more products not found.' });
    }

    let totalPrice = 0;
    for (const product of products) {
      const productRecord = productRecords.find(p => p._id.toString() === product.productId.toString());
      if (productRecord.stock < product.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product: ${productRecord.name}.` });
      }
      totalPrice += productRecord.price * product.quantity;
    }

    let discount = 0;
    if (voucherId) {
      const voucher = await Voucher.findById(voucherId);

      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found.' });
      }

      if (!voucher.isActive || new Date(voucher.expired) < new Date()) {
        return res.status(400).json({ message: 'Voucher is expired or inactive.' });
      }

      if (totalPrice < voucher.minPurchase) {
        return res.status(400).json({
          message: `Transaction does not meet the minimum purchase amount of ${voucher.minPurchase}.`,
        });
      }

      discount = (voucher.discount / 100) * totalPrice;

      if (voucher.quantity <= 0) {
        return res.status(400).json({ message: 'Voucher has no remaining quantity.' });
      }

      voucher.quantity -= 1;
      await voucher.save();
    }

    totalPrice -= discount;
    totalPrice = Math.max(totalPrice, 0);

    const newTransaction = new Transaction({
      userId,
      shopId,
      paymentId,
      voucherId: voucherId || null,
      courierId,
      addressId,
      products,
      totalPrice,
      note,
    });

    await newTransaction.save();

    const newStatus = new TransactionStatus({
      transactionId: newTransaction._id,
      status: 'Not Paid',
    });

    await newStatus.save();

    for (const product of products) {
      const productRecord = productRecords.find(p => p._id.toString() === product.productId.toString());
      productRecord.stock -= product.quantity;
      await productRecord.save();
    }

    res.status(201).json({
      message: 'Transaction created successfully.',
      transaction: newTransaction,
      status: newStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const payTransaction = async (req, res) => {
    const { transactionId, paymentId } = req.params;

    try {
      const transactionStatus = await TransactionStatus.findOne({ transactionId });
  
      if (!transactionStatus) {
        return res.status(404).json({ message: "Transaction status not found." });
      }

      if (transactionStatus.status === 'Paid') {
        return res.status(400).json({ message: "Transaction is already marked as Paid." });
      }
      
      if (transactionStatus.status !== 'Not Paid') {
        return res.status(400).json({ message: "Transaction must be in Not Paid state to mark as Paid." });
      }
  
      const transaction = await Transaction.findById(transactionId);

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not valid." });
      }

      const totalPrice = transaction.totalPrice;

      const paymentMethod = await PaymentMethod.findOne({ _id: paymentId });

      if (!paymentMethod) {
        return res.status(404).json({ message: "Payment method not found for user." });
      }

      if (paymentMethod.credit < totalPrice) {
        return res.status(400).json({ message: "Insufficient credit to make the transaction." });
      }

      paymentMethod.credit -= totalPrice;
      await paymentMethod.save();
  
      transactionStatus.status = 'Paid';
      await transactionStatus.save();
  
      res.status(200).json({ message: "Transaction status updated to Paid", transactionStatus });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
};

export const processTransaction = async (req, res) => {
    const { transactionId } = req.params;
    const userId = req.user._id;
  
    try {
      const shop = await Shop.findOne({ ownerId: userId });
  
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found for this user' });
      }
  
      const shopId = shop._id;
  
      const transaction = await Transaction.findById(transactionId);
  
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
  
      if (transaction.shopId.toString() !== shopId.toString()) {
        return res.status(403).json({ message: 'You do not have permission to update this transaction' });
      }
  
      const transactionStatus = await TransactionStatus.findOne({ transactionId });
  
      if (!transactionStatus) {
        return res.status(404).json({ message: 'Transaction status not found' });
      }
  
      if (transactionStatus.status !== 'Paid') {
        return res.status(400).json({ message: 'Transaction must be in Paid state to mark as Processed' });
      }
  
      transactionStatus.status = 'Processed';
      await transactionStatus.save();
  
      res.status(200).json({ message: 'Transaction status updated to Processed', transactionStatus });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const getTransactionSeller = async (req, res) => {
    const userId = req.user._id;
  
    try {
      const shop = await Shop.findOne({ ownerId: userId });
  
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found for this user' });
      }
  
      const shopId = shop._id;
  
      const transactions = await Transaction.find({ shopId });
  
      if (!transactions.length) {
        return res.status(404).json({ message: 'No transactions found for this shop' });
      }
  
      const transactionStatuses = await TransactionStatus.find({
        transactionId: { $in: transactions.map(tx => tx._id) },
      });
  
      if (!transactionStatuses.length) {
        return res.status(404).json({ message: 'No transaction statuses found' });
      }
  
      res.status(200).json({ message: 'Transaction statuses retrieved successfully', transactionStatuses });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const completeTransaction = async (req, res) => {
    const { transactionId } = req.params;

    try {
      const transactionStatus = await TransactionStatus.findOne({ transactionId });
  
      if (!transactionStatus) {
        return res.status(404).json({ message: "Transaction status not found." });
      }

      if (transactionStatus.status === 'Completed') {
        return res.status(400).json({ message: "Transaction is already marked as Completed." });
      }
      
      if (transactionStatus.status !== 'Processed') {
        return res.status(400).json({ message: "Transaction must be in Process state to mark as Completed." });
      }
  
      const transaction = await Transaction.findById(transactionId);

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not valid." });
      }

  
      transactionStatus.status = 'Completed';
      await transactionStatus.save();
  
      res.status(200).json({ message: "Transaction status updated to Completed", transactionStatus });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
};

export const getTransaction = async (req, res) => {
    const userId = req.user._id;
  
    try {
      const transactions = await Transaction.find({ userId });
  
      if (!transactions.length) {
        return res.status(404).json({ message: 'No transactions found for this buyer' });
      }
  
      const transactionStatuses = await TransactionStatus.find({
        transactionId: { $in: transactions.map(tx => tx._id) },
      });
  
      if (!transactionStatuses.length) {
        return res.status(404).json({ message: 'No transaction statuses found' });
      }
  
      res.status(200).json({ message: 'Transaction statuses retrieved successfully', transactionStatuses });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
};
  