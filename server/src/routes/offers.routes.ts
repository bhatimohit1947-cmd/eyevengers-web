import { Router } from 'express';
import { 
  getOffers, 
  getOfferById, 
  createOffer, 
  updateOffer, 
  deleteOffer,
  validateCoupon,
  getCalendarOffers,
  getOfferAnalytics,
  getOfferUsages
} from '../controllers/offers.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Calendar endpoint must be above /:id
router.get('/calendar', getCalendarOffers);

router.get('/', getOffers);
router.get('/:id', getOfferById);
router.get('/:id/analytics', authenticateAdmin, getOfferAnalytics);
router.get('/:id/usages', authenticateAdmin, getOfferUsages);
router.post('/', authenticateAdmin, createOffer);
router.put('/:id', authenticateAdmin, updateOffer);
router.delete('/:id', authenticateAdmin, deleteOffer);

// Coupon endpoints
router.post('/validate-coupon', validateCoupon);

export default router;
