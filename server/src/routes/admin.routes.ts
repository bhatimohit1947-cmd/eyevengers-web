import express from 'express';
import { 
  getProducts, createProduct, updateProduct, deleteProduct,
  getOrders, 
  getCustomers, createOrUpdateCustomer, syncCustomerStats,
  getSettings, updateSettings,
  getEyeTestSettings, updateEyeTestSettings,
  getEyeTestBookings, createEyeTestBooking, updateEyeTestBookingStatus,
  getStores, createStore, deleteStore,
  getLensSettings, updateLensSettings,
  getNotifications, markNotificationRead, recordLoginEvent,
  getSidebarCounts, loginAdmin
} from '../controllers/admin.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';

const router = express.Router();

// Public routes
router.post('/login', loginAdmin);
router.get('/settings', getSettings);

// Protect all following routes with authentication
router.use(authenticateAdmin);

router.get('/sidebar-counts', getSidebarCounts);
router.post('/login-event', recordLoginEvent);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/orders', getOrders);

router.get('/customers', getCustomers);
router.post('/customers', createOrUpdateCustomer);
router.post('/customers/stats', syncCustomerStats);

router.put('/settings', updateSettings);

router.get('/eye-test/settings', getEyeTestSettings);
router.put('/eye-test/settings', updateEyeTestSettings);

router.get('/eye-test/bookings', getEyeTestBookings);
router.post('/eye-test/bookings', createEyeTestBooking);
router.put('/eye-test/bookings/:id/status', updateEyeTestBookingStatus);

router.get('/stores', getStores);
router.post('/stores', createStore);
router.delete('/stores/:id', deleteStore);

router.get('/lenses/settings', getLensSettings);
router.put('/lenses/settings', updateLensSettings);

export default router;
