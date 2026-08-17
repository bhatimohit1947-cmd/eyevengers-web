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

const router = Router();

// Calendar endpoint must be above /:id
router.get('/calendar', getCalendarOffers);

router.get('/', getOffers);
router.get('/:id', getOfferById);
router.get('/:id/analytics', getOfferAnalytics);
router.get('/:id/usages', getOfferUsages);
router.post('/', createOffer);
router.put('/:id', updateOffer);
router.delete('/:id', deleteOffer);

// Coupon endpoints
router.post('/validate-coupon', validateCoupon);

export default router;
