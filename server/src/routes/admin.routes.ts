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

// ==========================================
// PUBLIC ROUTES (Used by Customer Frontend)
// ==========================================
router.post('/login', loginAdmin);
router.get('/settings', getSettings);
router.get('/products', getProducts);
router.get('/eye-test/settings', getEyeTestSettings);
router.post('/eye-test/bookings', createEyeTestBooking);
router.get('/stores', getStores);
router.get('/lenses/settings', getLensSettings);

// ==========================================
// PROTECTED ROUTES (Used by Admin Panel)
// ==========================================
router.use(authenticateAdmin);

router.get('/sidebar-counts', getSidebarCounts);
router.post('/login-event', recordLoginEvent);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/orders', getOrders);

router.get('/customers', getCustomers);
router.post('/customers', createOrUpdateCustomer);
router.post('/customers/stats', syncCustomerStats);

router.put('/settings', updateSettings);
router.put('/eye-test/settings', updateEyeTestSettings);

router.get('/eye-test/bookings', getEyeTestBookings);
router.put('/eye-test/bookings/:id/status', updateEyeTestBookingStatus);

router.post('/stores', createStore);
router.delete('/stores/:id', deleteStore);

router.put('/lenses/settings', updateLensSettings);

export default router;
