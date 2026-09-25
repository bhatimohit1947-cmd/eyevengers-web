import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import cmsRoutes from './routes/cms.routes';
import offersRoutes from './routes/offers.routes';
import adminRoutes from './routes/admin.routes';
import membershipRoutes from './routes/membership.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import uploadRoutes from './routes/upload.routes';
import referralRoutes from './routes/referral.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
export const prisma = new PrismaClient();

// Hide server fingerprint
app.disable('x-powered-by');

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  next();
});

// Production-ready Restricted CORS
const allowedOrigins = [
  'https://www.eyevengers.com',
  'https://eyevengers.com',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// In-Memory Brute Force Protection for Admin Login
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

app.use('/api/admin/login', (req, res, next) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    if (now - record.firstAttempt > LOGIN_WINDOW_MS) {
      loginAttempts.set(ip, { count: 1, firstAttempt: now });
    } else if (record.count >= MAX_LOGIN_ATTEMPTS) {
      return res.status(429).json({ 
        error: 'Too many failed login attempts. Please wait 15 minutes before trying again.' 
      });
    } else {
      record.count++;
    }
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  }

  next();
});

// Routes
app.use('/api/cms', cmsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/referral', referralRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Eyevengers API is running securely' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
