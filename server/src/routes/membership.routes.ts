import { Router } from 'express';
import {
  getMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  getMembershipCustomers
} from '../controllers/membership.controller';

const router = Router();

router.get('/plans', getMembershipPlans);
router.post('/plans', createMembershipPlan);
router.put('/plans/:id', updateMembershipPlan);

router.get('/customers', getMembershipCustomers);

export default router;
