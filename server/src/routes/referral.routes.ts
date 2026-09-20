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
// STORE STAFF & ADMIN ROUTES
// ==========================================
router.get('/admin/lookup', adminLookupVoucher);
router.post('/admin/redeem-store', adminRedeemStoreVoucher);
router.get('/admin/all', adminGetAllVouchers);
router.post('/admin/config', adminUpdateConfig);

export default router;
