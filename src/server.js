import express from 'express';
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import shopRoutes from './routes/shop.js';
import productRoutes from './routes/product.js';
import userRoutes from './routes/user.js';
import categoryRoutes from './routes/category.js'
import discussRoutes from './routes/discuss.js';
import searchRoutes from './routes/search.js';
import cartRoutes from './routes/cart.js';
import heroRoutes from './routes/hero.js';
import courierRoutes from './routes/courier.js';
import voucherRoutes from './routes/voucher.js';
import transactionRoutes from './routes/transaction.js';
import apiRoutes from './routes/api.js';
import articleRoutes from './routes/article.js';
import reviewRoutes from './routes/review.js';
import wishlistRoutes from './routes/wishlist.js';
import adminRoutes from './routes/admin.js';
import passportConfig from './configs/passport.js';
import path from 'path';
import { connectMongoDB } from './configs/mongodb.js';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const cdn = express();

const API_PORT = process.env.API_PORT;
const CDN_PORT = process.env.CDN_PORT;

const API_URL = process.env.API_BASE_URL;
const CDN_URL = process.env.CDN_BASE_URL;

passportConfig(passport);

app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(cors());
cdn.use(cors());

app.use('/', apiRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/category', categoryRoutes);
app.use('/product', productRoutes);
app.use('/shop', shopRoutes);
app.use('/user', userRoutes);
app.use('/discuss', discussRoutes);
app.use('/search', searchRoutes);
app.use('/cart', cartRoutes);
app.use('/hero', heroRoutes);
app.use('/courier', courierRoutes);
app.use('/voucher', voucherRoutes)
app.use('/transaction', transactionRoutes)
app.use('/wishlist', wishlistRoutes);
app.use('/article', articleRoutes);
app.use('/review', reviewRoutes);
connectMongoDB();

cdn.use((req, res, next) => {
    const allowedPath = path.join(__dirname, '../images');
    const requestedPath = path.join(__dirname, '../', req.path);

    if (!requestedPath.startsWith(allowedPath)) {
        return res.status(403).sendFile(path.join(__dirname, '../'));
    }

    next();
});

cdn.use(express.static(path.join(__dirname, '../')));

cdn.listen(CDN_PORT, '0.0.0.0', () => console.log(`CDN server is serving files at ${CDN_URL}:${CDN_PORT}`));
app.listen(API_PORT, '0.0.0.0', () => console.log(`API server is running at ${API_URL}:${API_PORT}`));
