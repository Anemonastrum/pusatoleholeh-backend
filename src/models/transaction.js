import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod', required: true },
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
  courierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Courier', required: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
    },
  ],
  totalPrice: { type: Number, required: true },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Transaction', transactionSchema);