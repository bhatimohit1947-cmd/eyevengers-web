import express from 'express';
import {
  getPublicReferralConfig,
  getUserReferralInfo,
  registerReferralAction,
  validateVoucher,
  claimVoucherOnline,
  adminLookupVoucher,
  adminRedeemStoreVoucher,
  adminGetAllVouchers,
  adminUpdateConfig
} from '../controllers/referral.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';

const router = express.Router();

// ==========================================
// CUSTOMER & PUBLIC ROUTES
// ==========================================
router.get('/config', getPublicReferralConfig);
router.get('/user-info', getUserReferralInfo);
router.post('/register-ref', registerReferralAction);
router.post('/validate-voucher', validateVoucher);
router.post('/claim-online', claimVoucherOnline);

// ==========================================
// STORE STAFF & ADMIN ROUTES (Protected)
// ==========================================
router.get('/admin/lookup', authenticateAdmin, adminLookupVoucher);
router.post('/admin/redeem-store', authenticateAdmin, adminRedeemStoreVoucher);
router.get('/admin/all', authenticateAdmin, adminGetAllVouchers);
router.post('/admin/config', authenticateAdmin, adminUpdateConfig);

export default router;
