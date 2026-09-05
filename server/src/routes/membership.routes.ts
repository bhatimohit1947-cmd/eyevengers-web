import { Router } from 'express';
import {
  getMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  getMembershipCustomers,
  updateMembershipCustomerStatus
} from '../controllers/membership.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/plans', getMembershipPlans); // Publicly accessible
router.post('/plans', authenticateAdmin, createMembershipPlan);
router.put('/plans/:id', authenticateAdmin, updateMembershipPlan);

router.get('/customers', authenticateAdmin, getMembershipCustomers);
router.put('/customers/:id/status', authenticateAdmin, updateMembershipCustomerStatus);

export default router;
