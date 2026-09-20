import { Request, Response } from 'express';

// Campaign configuration
interface ReferralConfig {
  campaignName: string;
  isActive: boolean;
  rewardType: 'FREE_FRAME' | 'PERCENT_DISCOUNT' | 'FLAT_DISCOUNT';
  rewardValue: number; // e.g. 30 for 30% or 100 for 100% free frame
  rewardTitle: string; // e.g. "Free Eyevengers Frame" or "30% OFF on Next Order"
  friendWelcomeDiscount: number; // e.g. 200 for ₹200 OFF
  minOrderValue: number; // e.g. 999
  validityDays: number; // e.g. 60
}

interface ReferralVoucher {
  id: string;
  code: string; // e.g. "REF-789XYZ"
  referrerPhone: string;
  referrerName: string;
  referredPhone?: string;
  referredName?: string;
  benefitType: string;
  benefitValue: number;
  benefitTitle: string;
  status: 'ACTIVE' | 'CLAIMED' | 'EXPIRED';
  issuedAt: string;
  expiresAt: string;
  claimedAt?: string;
  claimedChannel?: 'STORE' | 'ONLINE';
  claimedStoreLocation?: string;
  claimedStaffName?: string;
  claimedInvoiceNo?: string;
}

interface ReferralUser {
  phone: string;
  name: string;
  referralCode: string; // e.g. "EYE-ROHIT99"
  createdAt: string;
}

// In-Memory state with fallback and persistence
let referralConfig: ReferralConfig = {
  campaignName: 'Festive Refer & Earn 2026',
  isActive: true,
  rewardType: 'FREE_FRAME',
  rewardValue: 100,
  rewardTitle: 'FREE Eyevengers Frame (or 30% OFF)',
  friendWelcomeDiscount: 200,
  minOrderValue: 999,
  validityDays: 60,
};

let referralUsers: ReferralUser[] = [
  { phone: '9876543210', name: 'Rahul Sharma', referralCode: 'EYE-RAHUL10', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { phone: '9876543211', name: 'Priya Verma', referralCode: 'EYE-PRIYA22', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() }
];

let referralVouchers: ReferralVoucher[] = [
  {
    id: 'VOUCH-101',
    code: 'REF-FREE-789',
    referrerPhone: '9876543210',
    referrerName: 'Rahul Sharma',
    referredPhone: '9876543299',
    referredName: 'Sunil Kumar',
    benefitType: 'FREE_FRAME',
    benefitValue: 100,
    benefitTitle: '100% Free Premium Eyevengers Frame',
    status: 'ACTIVE',
    issuedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 58).toISOString(),
  },
  {
    id: 'VOUCH-102',
    code: 'REF-OFF30-456',
    referrerPhone: '9876543211',
    referrerName: 'Priya Verma',
    referredPhone: '9876543288',
    referredName: 'Anjali Mehra',
    benefitType: 'PERCENT_DISCOUNT',
    benefitValue: 30,
    benefitTitle: 'Flat 30% OFF on Frames & Lenses',
    status: 'CLAIMED',
    issuedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 45).toISOString(),
    claimedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    claimedChannel: 'STORE',
    claimedStoreLocation: 'Eyevengers Flagship Store - Delhi',
    claimedStaffName: 'Mohit (Store Mgr)',
    claimedInvoiceNo: 'INV-2026-904'
  }
];

// Helper to generate referral code
export const getOrCreateReferralCode = (phone: string, name?: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  let existing = referralUsers.find(u => u.phone.slice(-10) === cleanPhone);
  if (existing) return existing.referralCode;

  const prefix = (name ? name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) : 'EYE') || 'EYE';
  const randomDigits = Math.floor(100 + Math.random() * 900);
  const newCode = `${prefix}${cleanPhone.slice(-4) || randomDigits}`;

  const newUser: ReferralUser = {
    phone: cleanPhone,
    name: name || 'Valued Customer',
    referralCode: newCode,
    createdAt: new Date().toISOString()
  };
  referralUsers.push(newUser);
  return newCode;
};

// GET /api/referral/config (Public)
export const getPublicReferralConfig = (req: Request, res: Response) => {
  res.json({
    success: true,
    config: referralConfig
  });
};

// GET /api/referral/user-info?phone=...
export const getUserReferralInfo = (req: Request, res: Response) => {
  const phone = (req.query.phone as string || '').replace(/[^0-9]/g, '').slice(-10);
  const name = req.query.name as string || '';

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const referralCode = getOrCreateReferralCode(phone, name);
  const userVouchers = referralVouchers.filter(v => v.referrerPhone.slice(-10) === phone);
  const totalReferred = userVouchers.length;
  const activeRewards = userVouchers.filter(v => v.status === 'ACTIVE');
  const claimedRewards = userVouchers.filter(v => v.status === 'CLAIMED');

  res.json({
    success: true,
    referralCode,
    referralLink: `https://www.eyevengers.com/?ref=${referralCode}`,
    config: referralConfig,
    stats: {
      totalReferred,
      activeRewardsCount: activeRewards.length,
      claimedRewardsCount: claimedRewards.length
    },
    vouchers: userVouchers
  });
};

// POST /api/referral/register-ref (Triggered when friend signs up / orders)
export const registerReferralAction = (req: Request, res: Response) => {
  const { referralCode, friendPhone, friendName } = req.body;

  if (!referralCode || !friendPhone) {
    return res.status(400).json({ error: 'Referral code and friend phone required' });
  }

  const cleanFriendPhone = friendPhone.replace(/[^0-9]/g, '').slice(-10);
  const cleanRefCode = (referralCode || '').trim().toUpperCase();
  let referrer = referralUsers.find(u => u.referralCode.toUpperCase() === cleanRefCode);

  if (!referrer) {
    referrer = {
      phone: cleanRefCode.slice(-4),
      name: cleanRefCode.replace(/[0-9]/g, '') || 'Customer',
      referralCode: cleanRefCode,
      createdAt: new Date().toISOString()
    };
    referralUsers.push(referrer);
  }

  // Prevent self-referral
  if (referrer.phone.slice(-10) === cleanFriendPhone) {
    return res.status(400).json({ error: 'Self-referral is not permitted' });
  }

  const expiresAt = new Date(Date.now() + referralConfig.validityDays * 86400000).toISOString();

  // 1. Generate unique 1-time voucher for referrer
  const voucherCode = `REF-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const newVoucher: ReferralVoucher = {
    id: `VOUCH-${Date.now()}-REF`,
    code: voucherCode,
    referrerPhone: referrer.phone,
    referrerName: referrer.name,
    referredPhone: cleanFriendPhone,
    referredName: friendName || 'New Customer',
    benefitType: referralConfig.rewardType,
    benefitValue: referralConfig.rewardValue,
    benefitTitle: referralConfig.rewardTitle,
    status: 'ACTIVE',
    issuedAt: new Date().toISOString(),
    expiresAt,
  };
  referralVouchers.unshift(newVoucher);

  // 2. Generate unique welcome voucher for friend
  const friendVoucherCode = `REF-WELCOME-${Math.floor(1000 + Math.random() * 9000)}`;
  const friendVoucher: ReferralVoucher = {
    id: `VOUCH-${Date.now()}-FRD`,
    code: friendVoucherCode,
    referrerPhone: cleanFriendPhone,
    referrerName: friendName || 'New Customer',
    referredPhone: cleanFriendPhone,
    referredName: friendName || 'New Customer',
    benefitType: 'FLAT_DISCOUNT',
    benefitValue: referralConfig.friendWelcomeDiscount || 200,
    benefitTitle: `Friend Welcome: Flat ₹${referralConfig.friendWelcomeDiscount || 200} OFF`,
    status: 'ACTIVE',
    issuedAt: new Date().toISOString(),
    expiresAt,
  };
  referralVouchers.unshift(friendVoucher);

  res.json({
    success: true,
    message: 'Referral reward generated successfully for both Referrer and Friend!',
    voucher: newVoucher,
    friendVoucher
  });
};

// POST /api/referral/validate-voucher (Online Cart/Checkout Validation)
export const validateVoucher = (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Voucher code is required' });
  }

  const cleanCode = code.trim().toUpperCase();
  const voucher = referralVouchers.find(v => v.code.toUpperCase() === cleanCode);

  if (!voucher) {
    return res.status(404).json({ valid: false, error: 'Invalid referral voucher code' });
  }

  if (voucher.status === 'CLAIMED') {
    return res.status(400).json({ 
      valid: false, 
      error: `This voucher has already been claimed ${voucher.claimedChannel === 'STORE' ? 'at physical store' : 'online'} on ${new Date(voucher.claimedAt || '').toLocaleDateString('en-IN')}` 
    });
  }

  if (new Date(voucher.expiresAt).getTime() < Date.now()) {
    voucher.status = 'EXPIRED';
    return res.status(400).json({ valid: false, error: 'This voucher has expired' });
  }

  res.json({
    valid: true,
    voucher: {
      code: voucher.code,
      benefitType: voucher.benefitType,
      benefitValue: voucher.benefitValue,
      benefitTitle: voucher.benefitTitle,
      referrerName: voucher.referrerName
    }
  });
};

// POST /api/referral/claim-online (Marks voucher claimed after checkout order placed)
export const claimVoucherOnline = (req: Request, res: Response) => {
  const { code, orderId } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const voucher = referralVouchers.find(v => v.code.toUpperCase() === code.trim().toUpperCase());
  if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

  if (voucher.status === 'CLAIMED') {
    return res.status(400).json({ error: 'Voucher already claimed' });
  }

  voucher.status = 'CLAIMED';
  voucher.claimedAt = new Date().toISOString();
  voucher.claimedChannel = 'ONLINE';
  voucher.claimedInvoiceNo = orderId || 'ONLINE-ORDER';

  res.json({ success: true, message: 'Voucher marked as claimed online', voucher });
};

// ==========================================
// ADMIN & STORE STAFF CONTROLLERS
// ==========================================

// GET /api/referral/admin/lookup-voucher?query=... (Voucher code or customer phone)
export const adminLookupVoucher = (req: Request, res: Response) => {
  const query = (req.query.query as string || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }

  const cleanQuery = query.toUpperCase();
  const digitsOnly = query.replace(/[^0-9]/g, '');

  const matches = referralVouchers.filter(v => {
    return v.code.toUpperCase() === cleanQuery ||
           (digitsOnly.length >= 4 && v.referrerPhone.includes(digitsOnly)) ||
           (digitsOnly.length >= 4 && v.referredPhone?.includes(digitsOnly));
  });

  res.json({
    success: true,
    totalMatches: matches.length,
    vouchers: matches
  });
};

// POST /api/referral/admin/redeem-store (Staff marks as Claimed at Shop)
export const adminRedeemStoreVoucher = (req: Request, res: Response) => {
  const { voucherCode, storeLocation, staffName, invoiceNo, notes } = req.body;

  if (!voucherCode) {
    return res.status(400).json({ error: 'Voucher code is required' });
  }

  const voucher = referralVouchers.find(v => v.code.toUpperCase() === voucherCode.trim().toUpperCase());

  if (!voucher) {
    return res.status(404).json({ error: 'Voucher not found in system' });
  }

  if (voucher.status === 'CLAIMED') {
    return res.status(400).json({
      error: `ALREADY CLAIMED! This code was already redeemed on ${new Date(voucher.claimedAt || '').toLocaleString('en-IN')} at ${voucher.claimedStoreLocation || 'Store'}. It cannot be used again.`
    });
  }

  if (new Date(voucher.expiresAt).getTime() < Date.now()) {
    voucher.status = 'EXPIRED';
    return res.status(400).json({ error: 'This voucher has expired' });
  }

  // Mark claimed strictly for 1-time usage
  voucher.status = 'CLAIMED';
  voucher.claimedAt = new Date().toISOString();
  voucher.claimedChannel = 'STORE';
  voucher.claimedStoreLocation = storeLocation || 'Eyevengers Store';
  voucher.claimedStaffName = staffName || 'Store Staff';
  voucher.claimedInvoiceNo = invoiceNo || `STORE-CLAIM-${Date.now()}`;

  res.json({
    success: true,
    message: 'SUCCESS! Voucher has been claimed at the store. This code is now locked and cannot be reused.',
    voucher
  });
};

// GET /api/referral/admin/all-vouchers (Admin overview)
export const adminGetAllVouchers = (req: Request, res: Response) => {
  res.json({
    success: true,
    config: referralConfig,
    stats: {
      totalUsersWithCode: referralUsers.length,
      totalVouchersIssued: referralVouchers.length,
      totalClaimedAtStore: referralVouchers.filter(v => v.status === 'CLAIMED' && v.claimedChannel === 'STORE').length,
      totalClaimedOnline: referralVouchers.filter(v => v.status === 'CLAIMED' && v.claimedChannel === 'ONLINE').length,
      totalActiveVouchers: referralVouchers.filter(v => v.status === 'ACTIVE').length
    },
    vouchers: referralVouchers,
    users: referralUsers
  });
};

// POST /api/referral/admin/update-config (Admin changes campaign offers)
export const adminUpdateConfig = (req: Request, res: Response) => {
  const updates = req.body;
  referralConfig = {
    ...referralConfig,
    ...updates
  };
  res.json({
    success: true,
    message: 'Referral campaign settings updated successfully',
    config: referralConfig
  });
};
