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

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes will be added here
app.use('/api/cms', cmsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Eyevengers API is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
