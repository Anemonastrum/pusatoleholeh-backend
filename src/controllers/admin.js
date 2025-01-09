import User from '../models/user.js';
import Shop from '../models/shop.js';

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
            .populate('owner', 'name email -_id');
        res.status(200).json({ shops });
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
