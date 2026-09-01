import { Router } from 'express';
import {
  getMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  getMembershipCustomers,
  updateMembershipCustomerStatus
} from '../controllers/membership.controller';

const router = Router();

router.get('/plans', getMembershipPlans);
router.post('/plans', createMembershipPlan);
router.put('/plans/:id', updateMembershipPlan);

router.get('/customers', getMembershipCustomers);
router.put('/customers/:id/status', updateMembershipCustomerStatus);

export default router;
