import Product from '../models/product.js';
import ProductImage from '../models/productImage.js';

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, images } = req.body;
    const { shopId } = req.params;

    // Create new product
    const product = new Product({
      name,
      description,
      price,
      stock,
      category,
      shopId
    });

    // Save product
    await product.save();

    // Save images
    for (const image of images) {
      const productImage = new ProductImage({
        name: image.name,
        path: image.path,
        url: image.url,
        productId: product._id
      });
      await productImage.save();
    }

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (err) {
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
};

// Update a product
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const product = req.product;

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock || product.stock;
    product.category = category || product.category;

    await product.save();
    res.json({ message: 'Product updated successfully', product });
  } catch (err) {
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  try {
    await req.product.remove();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
};

// Get a product by ID
export const getProductById = async (req, res) => {
  try {
    const product = req.product;
    const images = await ProductImage.find({ productId: product._id });

    res.json({ product, images });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving product', error: err.message });
  }
};
