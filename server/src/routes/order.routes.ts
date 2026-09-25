import express from 'express';
import { createOrder, verifyPayment, getOrders, updateOrderStatus } from '../controllers/order.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', getOrders);
router.post('/create', createOrder);
router.post('/verify', verifyPayment);
router.put('/:id/status', authenticateAdmin, updateOrderStatus);

export default router;
