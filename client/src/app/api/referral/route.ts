import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Global serverless in-memory storage for Vercel
if (!(globalThis as any).referralData) {
  (globalThis as any).referralData = {
    config: {
      campaignName: 'Festive Refer & Earn 2026',
      isActive: true,
      rewardType: 'FREE_FRAME',
      rewardValue: 100,
      rewardTitle: 'FREE Eyevengers Frame (or 30% OFF)',
      friendWelcomeDiscount: 200,
      minOrderValue: 999,
      validityDays: 60,
    },
    users: [
      { phone: '9876543210', name: 'Rahul Sharma', referralCode: 'EYE-RAHUL10', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
      { phone: '9876543211', name: 'Priya Verma', referralCode: 'EYE-PRIYA22', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() }
    ],
    vouchers: [
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
    ]
  };
}

const getStore = () => (globalThis as any).referralData;

// GET /api/referral?action=user-info&phone=... OR action=lookup&query=... OR action=admin-all
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'config';
  const store = getStore();

  if (action === 'config') {
    return NextResponse.json({ success: true, config: store.config });
  }

  if (action === 'user-info') {
    const phone = (searchParams.get('phone') || '').replace(/[^0-9]/g, '').slice(-10);
    const name = searchParams.get('name') || '';

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    let user = store.users.find((u: any) => u.phone.slice(-10) === phone);
    if (!user) {
      const prefix = (name ? name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) : 'EYE') || 'EYE';
      const newCode = `${prefix}${phone.slice(-4) || '1234'}`;
      user = {
        phone,
        name: name || 'Valued Customer',
        referralCode: newCode,
        createdAt: new Date().toISOString()
      };
      store.users.push(user);
    }

    const userVouchers = store.vouchers.filter((v: any) => v.referrerPhone.slice(-10) === phone);
    return NextResponse.json({
      success: true,
      referralCode: user.referralCode,
      referralLink: `https://www.eyevengers.com/?ref=${user.referralCode}`,
      config: store.config,
      stats: {
        totalReferred: userVouchers.length,
        activeRewardsCount: userVouchers.filter((v: any) => v.status === 'ACTIVE').length,
        claimedRewardsCount: userVouchers.filter((v: any) => v.status === 'CLAIMED').length
      },
      vouchers: userVouchers
    });
  }

  if (action === 'lookup') {
    const query = (searchParams.get('query') || '').trim().toUpperCase();
    const digitsOnly = query.replace(/[^0-9]/g, '');

    const matches = store.vouchers.filter((v: any) => {
      return v.code.toUpperCase() === query ||
             (digitsOnly.length >= 4 && v.referrerPhone.includes(digitsOnly)) ||
             (digitsOnly.length >= 4 && v.referredPhone?.includes(digitsOnly));
    });

    return NextResponse.json({
      success: true,
      totalMatches: matches.length,
      vouchers: matches
    });
  }

  if (action === 'admin-all') {
    return NextResponse.json({
      success: true,
      config: store.config,
      stats: {
        totalUsersWithCode: store.users.length,
        totalVouchersIssued: store.vouchers.length,
        totalClaimedAtStore: store.vouchers.filter((v: any) => v.status === 'CLAIMED' && v.claimedChannel === 'STORE').length,
        totalClaimedOnline: store.vouchers.filter((v: any) => v.status === 'CLAIMED' && v.claimedChannel === 'ONLINE').length,
        totalActiveVouchers: store.vouchers.filter((v: any) => v.status === 'ACTIVE').length
      },
      vouchers: store.vouchers,
      users: store.users
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// POST actions: validate, register-ref, redeem-store, claim-online, update-config
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const store = getStore();

    if (action === 'validate-voucher') {
      const code = (body.code || '').trim().toUpperCase();
      const voucher = store.vouchers.find((v: any) => v.code.toUpperCase() === code);

      if (!voucher) {
        return NextResponse.json({ valid: false, error: 'Invalid referral voucher code' }, { status: 404 });
      }

      if (voucher.status === 'CLAIMED') {
        return NextResponse.json({
          valid: false,
          error: `Already used! Claimed on ${new Date(voucher.claimedAt || '').toLocaleDateString('en-IN')} (${voucher.claimedChannel === 'STORE' ? 'At Store' : 'Online'})`
        }, { status: 400 });
      }

      if (new Date(voucher.expiresAt).getTime() < Date.now()) {
        voucher.status = 'EXPIRED';
        return NextResponse.json({ valid: false, error: 'This voucher has expired' }, { status: 400 });
      }

      return NextResponse.json({
        valid: true,
        voucher: {
          code: voucher.code,
          benefitType: voucher.benefitType,
          benefitValue: voucher.benefitValue,
          benefitTitle: voucher.benefitTitle,
          referrerName: voucher.referrerName
        }
      });
    }

    if (action === 'redeem-store') {
      const { voucherCode, storeLocation, staffName, invoiceNo } = body;
      const voucher = store.vouchers.find((v: any) => v.code.toUpperCase() === (voucherCode || '').trim().toUpperCase());

      if (!voucher) {
        return NextResponse.json({ error: 'Voucher code not found in system' }, { status: 404 });
      }

      if (voucher.status === 'CLAIMED') {
        return NextResponse.json({
          error: `ALREADY CLAIMED! This code was already redeemed on ${new Date(voucher.claimedAt || '').toLocaleString('en-IN')} at ${voucher.claimedStoreLocation || 'Store'}. It cannot be used again.`
        }, { status: 400 });
      }

      // Mark single-use claimed
      voucher.status = 'CLAIMED';
      voucher.claimedAt = new Date().toISOString();
      voucher.claimedChannel = 'STORE';
      voucher.claimedStoreLocation = storeLocation || 'Eyevengers Flagship Store';
      voucher.claimedStaffName = staffName || 'Store Manager';
      voucher.claimedInvoiceNo = invoiceNo || `INV-${Date.now().toString().slice(-6)}`;

      return NextResponse.json({
        success: true,
        message: 'SUCCESS: Voucher has been marked as Claimed at Store. Code is now locked and cannot be reused.',
        voucher
      });
    }

    if (action === 'claim-online') {
      const { code, orderId } = body;
      const voucher = store.vouchers.find((v: any) => v.code.toUpperCase() === (code || '').trim().toUpperCase());
      if (voucher && voucher.status === 'ACTIVE') {
        voucher.status = 'CLAIMED';
        voucher.claimedAt = new Date().toISOString();
        voucher.claimedChannel = 'ONLINE';
        voucher.claimedInvoiceNo = orderId || 'ONLINE-ORDER';
      }
      return NextResponse.json({ success: true, voucher });
    }

    if (action === 'register-ref') {
      const { referralCode, friendPhone, friendName } = body;
      const cleanFriendPhone = (friendPhone || '').replace(/[^0-9]/g, '').slice(-10);
      const referrer = store.users.find((u: any) => u.referralCode.toUpperCase() === (referralCode || '').toUpperCase());

      if (!referrer) {
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
      }

      if (referrer.phone.slice(-10) === cleanFriendPhone) {
        return NextResponse.json({ error: 'Self-referral is not permitted' }, { status: 400 });
      }

      const voucherCode = `REF-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const expiresAt = new Date(Date.now() + store.config.validityDays * 86400000).toISOString();

      const newVoucher = {
        id: `VOUCH-${Date.now()}`,
        code: voucherCode,
        referrerPhone: referrer.phone,
        referrerName: referrer.name,
        referredPhone: cleanFriendPhone,
        referredName: friendName || 'New Friend',
        benefitType: store.config.rewardType,
        benefitValue: store.config.rewardValue,
        benefitTitle: store.config.rewardTitle,
        status: 'ACTIVE',
        issuedAt: new Date().toISOString(),
        expiresAt,
      };

      store.vouchers.unshift(newVoucher);
      return NextResponse.json({ success: true, voucher: newVoucher });
    }

    if (action === 'update-config') {
      store.config = { ...store.config, ...body.config };
      return NextResponse.json({ success: true, config: store.config });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
