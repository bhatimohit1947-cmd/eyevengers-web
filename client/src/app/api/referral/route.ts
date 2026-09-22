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
    users: [],
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

const SUPABASE_URL = 'https://bhjfsthxmzqumajquyvn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fvqOImRG-8kMsfQxln9WMw_JmBmCmNy';
const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates'
};

async function saveVoucherToSupabase(v: any) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/referral_vouchers`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify({
        id: v.id || `VOUCH-${v.code}`,
        code: v.code,
        referrer_phone: v.referrerPhone || '0000000000',
        referrer_name: v.referrerName || 'Valued Customer',
        referred_phone: v.referredPhone || null,
        referred_name: v.referredName || null,
        benefit_type: v.benefitType || 'PERCENT_DISCOUNT',
        benefit_value: v.benefitValue || 0,
        benefit_title: v.benefitTitle || 'Discount',
        status: v.status || 'ACTIVE',
        issued_at: v.issuedAt || new Date().toISOString(),
        expires_at: v.expiresAt || null,
        claimed_at: v.claimedAt || null,
        claimed_channel: v.claimedChannel || null,
        claimed_store: v.claimedStoreLocation || null,
        claimed_by_staff: v.claimedStaffName || null,
        invoice_no: v.claimedInvoiceNo || null
      })
    });
  } catch(e) {}
}

async function updateVoucherInSupabase(code: string, updates: any) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/referral_vouchers?code=eq.${encodeURIComponent(code)}`, {
      method: 'PATCH',
      headers: supabaseHeaders,
      body: JSON.stringify(updates)
    });
  } catch(e) {}
}

let lastSyncTime = 0;

const ensureStoreLoaded = async () => {
  const store = (globalThis as any).referralData;
  const now = Date.now();
  // Resync every 15 seconds or on cold start
  if (now - lastSyncTime > 15000) {
    lastSyncTime = now;
    // 1. Fetch from Supabase referral_vouchers table
    try {
      const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/referral_vouchers?select=*`, {
        headers: supabaseHeaders,
        cache: 'no-store'
      });
      if (sbRes.ok) {
        const rows = await sbRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const vMap = new Map();
          (store.vouchers || []).forEach((v: any) => vMap.set(v.code, v));
          rows.forEach((r: any) => {
            vMap.set(r.code, {
              id: r.id,
              code: r.code,
              referrerPhone: r.referrer_phone,
              referrerName: r.referrer_name,
              referredPhone: r.referred_phone,
              referredName: r.referred_name,
              benefitType: r.benefit_type,
              benefitValue: Number(r.benefit_value),
              benefitTitle: r.benefit_title,
              status: r.status,
              issuedAt: r.issued_at,
              expiresAt: r.expires_at,
              claimedAt: r.claimed_at,
              claimedChannel: r.claimed_channel,
              claimedStoreLocation: r.claimed_store,
              claimedStaffName: r.claimed_by_staff,
              claimedInvoiceNo: r.invoice_no
            });
          });
          store.vouchers = Array.from(vMap.values());
        }
      }
    } catch(e) {}
    try {
      const res = await fetch('https://eyevengers-web.onrender.com/api/admin/referral-data', { cache: 'no-store' });
      if (res.ok) {
        const remoteData = await res.json();
        if (remoteData && Array.isArray(remoteData.vouchers)) {
          const voucherMap = new Map();
          (store.vouchers || []).forEach((v: any) => voucherMap.set(v.code, v));
          (remoteData.vouchers || []).forEach((v: any) => voucherMap.set(v.code, v));
          store.vouchers = Array.from(voucherMap.values());

          if (remoteData.config) store.config = { ...store.config, ...remoteData.config };
          
          if (Array.isArray(remoteData.users)) {
            const userMap = new Map();
            (store.users || []).forEach((u: any) => userMap.set(u.phone, u));
            (remoteData.users || []).forEach((u: any) => userMap.set(u.phone, u));
            store.users = Array.from(userMap.values());
          }
        }
      }
    } catch (e) {
      // Backend not yet reached or offline, fallback to in-memory
    }
  }
  return store;
};

const persistStore = (store: any) => {
  try {
    fetch('https://eyevengers-web.onrender.com/api/admin/referral-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store)
    }).catch(() => {});
  } catch (e) {}
};

const getStore = () => (globalThis as any).referralData;

// GET /api/referral?action=user-info&phone=... OR action=lookup&query=... OR action=admin-all
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'config';
  const store = await ensureStoreLoaded();

  if (action === 'config') {
    return NextResponse.json({ success: true, config: store.config });
  }

  if (action === 'user-info') {
    const phoneParam = (searchParams.get('phone') || '').replace(/[^0-9]/g, '').slice(-10);
    const nameParam = (searchParams.get('name') || '').trim();

    let customerRecord: any = null;
    let referralCode = '';

    // 1. First look up directly in Supabase customers table
    try {
      let sbUrl = `${SUPABASE_URL}/rest/v1/customers?select=*`;
      if (phoneParam) {
        sbUrl += `&phone=eq.${phoneParam}`;
      } else if (nameParam) {
        sbUrl += `&name=ilike.%25${encodeURIComponent(nameParam)}%25`;
      }
      const sbRes = await fetch(sbUrl, { headers: supabaseHeaders, cache: 'no-store' });
      if (sbRes.ok) {
        const custs = await sbRes.json();
        if (Array.isArray(custs) && custs.length > 0) {
          customerRecord = custs[0];
          referralCode = customerRecord.referral_code || '';
        }
      }
    } catch(e) {}

    const resolvedPhone = phoneParam || customerRecord?.phone || '';
    const resolvedName = (customerRecord?.name || nameParam || 'Customer').trim();

    // 2. If customer has no referralCode yet, generate one from their real name & phone
    if (!referralCode && (resolvedPhone || resolvedName)) {
      const cleanName = resolvedName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'EYE';
      const last4 = (resolvedPhone || '1234').slice(-4);
      referralCode = `EYE-${cleanName}${last4}`;

      // Persist to Supabase customers table
      if (resolvedPhone) {
        fetch(`${SUPABASE_URL}/rest/v1/customers?phone=eq.${resolvedPhone}`, {
          method: 'PATCH',
          headers: supabaseHeaders,
          body: JSON.stringify({ referral_code: referralCode })
        }).catch(() => {});
      }
    }

    // 3. Fetch vouchers belonging to this referrer from store & Supabase
    const userVouchers = (store.vouchers || []).filter((v: any) => 
      (resolvedPhone && v.referrerPhone && v.referrerPhone.slice(-10) === resolvedPhone) ||
      (resolvedName && v.referrerName && v.referrerName.toLowerCase() === resolvedName.toLowerCase())
    );

    return NextResponse.json({
      success: true,
      referralCode: referralCode || `EYE-${(resolvedPhone || '1234').slice(-4)}`,
      referralLink: `https://www.eyevengers.com/?ref=${referralCode || `EYE-${(resolvedPhone || '1234').slice(-4)}`}`,
      config: store.config,
      customer: {
        name: resolvedName,
        phone: resolvedPhone
      },
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
    let allCustomers: any[] = [];
    try {
      const cRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*`, { headers: supabaseHeaders, cache: 'no-store' });
      if (cRes.ok) {
        allCustomers = await cRes.json();
      }
    } catch(e) {}

    const usersList = (allCustomers || []).map((c: any) => {
      const cVouchers = (store.vouchers || []).filter((v: any) => v.referrerPhone?.slice(-10) === c.phone?.slice(-10));
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        referralCode: c.referral_code || `EYE-${c.name?.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'EYE'}${c.phone?.slice(-4) || '1234'}`,
        totalReferred: cVouchers.length,
        activeRewards: cVouchers.filter((v: any) => v.status === 'ACTIVE').length,
        claimedRewards: cVouchers.filter((v: any) => v.status === 'CLAIMED').length,
        createdAt: c.created_at
      };
    });

    return NextResponse.json({
      success: true,
      config: store.config,
      stats: {
        totalUsersWithCode: usersList.length,
        totalVouchersIssued: store.vouchers.length,
        totalClaimedAtStore: store.vouchers.filter((v: any) => v.status === 'CLAIMED' && v.claimedChannel === 'STORE').length,
        totalClaimedOnline: store.vouchers.filter((v: any) => v.status === 'CLAIMED' && v.claimedChannel === 'ONLINE').length,
        totalActiveVouchers: store.vouchers.filter((v: any) => v.status === 'ACTIVE').length
      },
      vouchers: store.vouchers,
      users: usersList
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// POST actions: validate, register-ref, redeem-store, claim-online, update-config
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const store = await ensureStoreLoaded();

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

      persistStore(store);
      updateVoucherInSupabase(voucher.code, {
        status: 'CLAIMED',
        claimed_at: voucher.claimedAt,
        claimed_channel: 'STORE',
        claimed_store: voucher.claimedStoreLocation,
        claimed_by_staff: voucher.claimedStaffName,
        invoice_no: voucher.claimedInvoiceNo
      });

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
        persistStore(store);
        updateVoucherInSupabase(voucher.code, {
          status: 'CLAIMED',
          claimed_at: voucher.claimedAt,
          claimed_channel: 'ONLINE',
          invoice_no: voucher.claimedInvoiceNo
        });
      }
      return NextResponse.json({ success: true, voucher });
    }

    if (action === 'register-ref') {
      const { referralCode, friendPhone, friendName } = body;
      const cleanFriendPhone = (friendPhone || '').replace(/[^0-9]/g, '').slice(-10);
      const cleanRefCode = (referralCode || '').trim().toUpperCase();

      // Find or dynamically resolve referrer by referral code
      let referrer = store.users.find((u: any) => u.referralCode.toUpperCase() === cleanRefCode);

      // If user not in memory yet, parse from code e.g. PRADE8860 or MOHIT1234
      if (!referrer) {
        referrer = {
          phone: cleanRefCode.slice(-4),
          name: cleanRefCode.replace(/[0-9]/g, ''),
          referralCode: cleanRefCode,
          createdAt: new Date().toISOString()
        };
        store.users.push(referrer);
      }

      if (referrer.phone.slice(-10) === cleanFriendPhone) {
        return NextResponse.json({ error: 'Self-referral is not permitted' }, { status: 400 });
      }

      const expiresAt = new Date(Date.now() + store.config.validityDays * 86400000).toISOString();

      // 1. Generate Referrer Reward Voucher (e.g. Free Frame or 30% OFF)
      const referrerVoucherCode = `REF-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const referrerVoucher = {
        id: `VOUCH-${Date.now()}-REF`,
        code: referrerVoucherCode,
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
      store.vouchers.unshift(referrerVoucher);

      // 2. Generate Friend Welcome Voucher (e.g. Flat ₹200 OFF on First Purchase)
      const friendVoucherCode = `REF-WELCOME-${Math.floor(1000 + Math.random() * 9000)}`;
      const friendVoucher = {
        id: `VOUCH-${Date.now()}-FRD`,
        code: friendVoucherCode,
        referrerPhone: cleanFriendPhone,
        referrerName: friendName || 'New Friend',
        referredPhone: cleanFriendPhone,
        referredName: friendName || 'New Friend',
        benefitType: 'FLAT_DISCOUNT',
        benefitValue: store.config.friendWelcomeDiscount || 200,
        benefitTitle: `Friend Welcome: Flat ₹${store.config.friendWelcomeDiscount || 200} OFF`,
        status: 'ACTIVE',
        issuedAt: new Date().toISOString(),
        expiresAt,
      };
      store.vouchers.unshift(friendVoucher);

      persistStore(store);
      saveVoucherToSupabase(referrerVoucher);
      saveVoucherToSupabase(friendVoucher);

      return NextResponse.json({ 
        success: true, 
        message: 'Referral registered successfully! Rewards generated for both Referrer and Friend.',
        voucher: referrerVoucher,
        friendVoucher 
      });
    }

    if (action === 'update-config') {
      store.config = { ...store.config, ...body.config };
      persistStore(store);
      return NextResponse.json({ success: true, config: store.config });
    }


    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
