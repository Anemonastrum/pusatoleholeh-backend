import User from '../models/user.js';
import Shop from '../models/shop.js';
import Product from '../models/product.js';
import Category from '../models/category.js';
import Article from '../models/article.js';
import Voucher from '../models/voucher.js'; 

export const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;
        
        if (!['seller', 'buyer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        const users = await User.find({ role }).select('-password');
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

export const getAllShops = async (req, res) => {
    try {
        const shops = await Shop.find()
            .populate({
                path: 'ownerId',
                select: 'name email phoneNumber role isBanned -_id'
            })
            .select('name username description address createdAt updatedAt');

        const formattedShops = shops.map(shop => ({
            shopInfo: {
                name: shop.name,
                username: shop.username,
                description: shop.description,
                address: {
                    province: shop.address.province,
                    city: shop.address.city,
                    district: shop.address.district,
                    subdistrict: shop.address.subdistrict,
                    postalCode: shop.address.postalCode
                },
                createdAt: shop.createdAt,
                updatedAt: shop.updatedAt
            },
            ownerInfo: {
                name: shop.ownerId.name,
                email: shop.ownerId.email,
                phoneNumber: shop.ownerId.phoneNumber,
                role: shop.ownerId.role,
                isBanned: shop.ownerId.isBanned
            }
        }));

        res.status(200).json({ 
            count: shops.length,
            shops: formattedShops 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shops', error: error.message });
    }
};

export const toggleUserBan = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isBanned = !user.isBanned;
        await user.save();

        res.status(200).json({ 
            message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isBanned: user.isBanned
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user ban status', error: error.message });
    }
};

export const getTotals = async (req, res) => {
    try {
      const totalProducts = await Product.countDocuments();
      const totalUsers = await User.countDocuments();
      const totalShops = await Shop.countDocuments();
      const totalVouchers = await Voucher.countDocuments();
      const totalBlogs = await Article.countDocuments();
      const totalCategories = await Category.countDocuments();
  
      res.status(200).json({
        message: 'Totals retrieved successfully',
        totals: {
          products: totalProducts,
          users: totalUsers,
          shops: totalShops,
          vouchers: totalVouchers,
          blogs: totalBlogs,
          categories: totalCategories,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching totals', error: error.message });
    }
};