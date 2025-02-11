import mongoose from 'mongoose';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import ProductCover from '../models/productCover.js';
import { createAlert } from './alert.js';

// ADD PRODUCT TO CART
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.params;

    const quantityInt = parseInt(quantity, 10);
    if (isNaN(quantityInt) || quantityInt <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive integer.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (quantityInt > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} items available in stock.` });
    }

    const existingCartItem = await Cart.findOne({ userId: req.user._id, productId });
    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantityInt;

      if (newQuantity > product.stock) {
        return res.status(400).json({ message: `Adding exceeds stock. Only ${product.stock} items available.` });
      }

      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();
      return res.status(200).json({ message: 'Cart updated.', cart: existingCartItem });
    }

    const cartItem = new Cart({
      userId: req.user._id,
      productId,
      quantity: quantityInt,
    });

    await cartItem.save();
    res.status(201).json({ message: 'Product added to cart.', cart: cartItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// UPDATE CART QUANTITY
export const updateCartQuantity = async (req, res) => {
  try {
    const { cartId, quantity } = req.body;

    const cartItem = await Cart.findById(cartId).populate('productId');
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    const product = cartItem.productId;
    if (quantity > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} items available in stock.` });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({ message: 'Cart quantity updated.', cart: cartItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// REMOVE ITEM FROM CART
export const removeFromCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    const cartItem = await Cart.findById(cartId);
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    await Cart.findByIdAndDelete(cartId);
    res.status(200).json({ message: 'Product removed from cart.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// REMOVE ALL ITEMS FROM CART
export const clearCart = async (req, res) => {
  try {
    const cartItems = await Cart.find({ userId: req.user._id }).populate('productId');
    if (!cartItems.length) {
      return res.status(400).json({ message: 'Your cart is already empty.' });
    }

    await Cart.deleteMany({ userId: req.user._id });
    res.status(200).json({ message: 'All items removed from cart.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET CART ITEMS
export const getCart = async (req, res) => {
  try {
    // Populate productId dengan data produk termasuk referensi ke shop
    const cart = await Cart.find({ userId: req.user._id })
      .populate({
        path: 'productId',
        select: 'name price stock shopId',
        populate: {
          path: 'shopId',
          select: 'name username'
        }
      });

    if (!cart.length) {
      return res.status(200).json({ message: "Your cart is empty. Let's add some stuff!", cart: [] });
    }

    const cartWithPic = await Promise.all(
      cart.map(async (item) => {
        const productCover = await ProductCover.findOne({ productId: item.productId._id });
        return {
          ...item.toObject(),
          productCover: productCover ? productCover.url : null,
        };
      })
    );

    res.status(200).json(cartWithPic);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// CHECKOUT CART
export const checkoutCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;

    const cartItems = await Cart.find({ userId }).populate('productId');
    if (!cartItems.length) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    for (const item of cartItems) {
      const product = item.productId;
      if (!product) {
        throw new Error(`Product not found for cart item: ${item._id}`);
      }
      if (item.quantity > product.stock) {
        throw new Error(`Insufficient stock for product: ${product.name}. Only ${product.stock} left.`);
      }
    }

    for (const item of cartItems) {
      const product = item.productId;
      product.stock -= item.quantity;

      if (product.stock === 0) {
        await createAlert(product.shopId, `Product "${product.name}" is out of stock.`, 'warning');
      } else if (product.stock > 0 && product.stock < 5) {
        await createAlert(product.shopId, `Product "${product.name}" is running low on stock (${product.stock} left).`, 'info');
      }

      await product.save({ session });
      await Cart.findByIdAndDelete(item._id, { session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Checkout successful. Thank you for your purchase!' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({ message: error.message });
  }
};
