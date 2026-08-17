import express from 'express';
import { 
  getProducts, createProduct, 
  getOrders, 
  getCustomers, 
  getSettings, updateSettings,
  getEyeTestSettings, updateEyeTestSettings,
  getEyeTestBookings, createEyeTestBooking,
  getStores, createStore, deleteStore,
  getLensSettings, updateLensSettings
} from '../controllers/admin.controller';

const router = express.Router();

router.get('/products', getProducts);
router.post('/products', createProduct);

router.get('/orders', getOrders);

router.get('/customers', getCustomers);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

router.get('/eye-test/settings', getEyeTestSettings);
router.put('/eye-test/settings', updateEyeTestSettings);

router.get('/eye-test/bookings', getEyeTestBookings);
router.post('/eye-test/bookings', createEyeTestBooking);

router.get('/stores', getStores);
router.post('/stores', createStore);
router.delete('/stores/:id', deleteStore);

router.get('/lenses/settings', getLensSettings);
router.put('/lenses/settings', updateLensSettings);

export default router;
