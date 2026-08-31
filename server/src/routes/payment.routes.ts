import { Router } from 'express';
import { createMembershipOrder, verifyMembershipPayment } from '../controllers/payment.controller';

const router = Router();

router.post('/create-order', createMembershipOrder);
router.post('/verify', verifyMembershipPayment);

export default router;
