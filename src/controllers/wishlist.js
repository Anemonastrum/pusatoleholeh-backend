import Wishlist from "../models/wishlist.js";
import Product from "../models/product.js";

export const addProductToWishlist = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const existingWishlist = await Wishlist.findOne({ userId, productId });
    if (existingWishlist) {
      return res.status(400).json({ message: "Product already in wishlist." });
    }

    const newWishlistItem = new Wishlist({ userId, productId });
    await newWishlistItem.save();

    res.status(201).json({ message: "Product added to wishlist.", wishlist: newWishlistItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const removeProductFromWishlist = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  try {
    const deletedWishlist = await Wishlist.findOneAndDelete({ userId, productId });

    if (!deletedWishlist) {
      return res.status(404).json({ message: "Product not found in wishlist." });
    }

    res.status(200).json({ message: "Product removed from wishlist." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const getWishlist = async (req, res) => {
  const userId = req.user._id;

  try {
    const wishlist = await Wishlist.find({ userId }).populate({
      path: "productId",
      select: "name price shopId",
      populate: {
        path: "shopId",
        select: "username",
      },
    });

    if (!wishlist || wishlist.length === 0) {
      return res.status(404).json({ message: "Wishlist is empty." });
    }

    const shopProducts = wishlist.reduce((acc, item) => {
      const shopId = item.productId.shopId;
      if (!shopId) return acc;

      const shopUsername = shopId.username;
      if (!acc[shopUsername]) {
        acc[shopUsername] = [];
      }
      acc[shopUsername].push({
        productId: item.productId._id,
        name: item.productId.name,
        price: item.productId.price,
        addedAt: item.createdAt,
      });
      return acc;
    }, {});

    res.status(200).json({ message: "Wishlist retrieved successfully.", shopProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};
