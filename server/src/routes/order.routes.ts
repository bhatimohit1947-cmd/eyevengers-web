import express from 'express';
import { createOrder, verifyPayment, getOrders, updateOrderStatus } from '../controllers/order.controller';

const router = express.Router();

router.get('/', getOrders);
router.post('/create', createOrder);
router.post('/verify', verifyPayment);
router.put('/:id/status', updateOrderStatus);

export default router;
