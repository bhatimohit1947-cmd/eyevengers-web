import { NextRequest, NextResponse } from 'next/server';
import { isValidAdminToken } from '@/utils/adminAuthServer';

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
      requiredFriendsCount: 1, // Number of friends required to unlock each reward
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

async function saveConfigToSupabase(config: any) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/global_settings`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify({
        key: 'referral_campaign_config',
        value: JSON.stringify(config)
      })
    });
  } catch(e) {}
}

let lastSyncTime = 0;

const ensureStoreLoaded = async () => {
  const store = (globalThis as any).referralData;
  const now = Date.now();
  // Resync every 10 seconds or on cold start
  if (now - lastSyncTime > 10000) {
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

    // 2. Fetch config from Supabase global_settings table
    try {
      const gsRes = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=eq.referral_campaign_config`, {
        headers: supabaseHeaders,
        cache: 'no-store'
      });
      if (gsRes.ok) {
        const gsRows = await gsRes.json();
        if (Array.isArray(gsRows) && gsRows.length > 0 && gsRows[0].value) {
          const cfg = typeof gsRows[0].value === 'string' ? JSON.parse(gsRows[0].value) : gsRows[0].value;
          store.config = { ...store.config, ...cfg };
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

    // Guard: Never query all customers or leak another customer's data!
    if (!phoneParam || phoneParam.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Valid 10-digit phone number is required to retrieve referral data',
        config: store.config
      }, { status: 400 });
    }

    let customerRecord: any = null;
    let referralCode = '';

    // 1. First look up directly in Supabase customers table strictly by this user's phone
    try {
      const sbUrl = `${SUPABASE_URL}/rest/v1/customers?select=*&phone=eq.${phoneParam}`;
      const sbRes = await fetch(sbUrl, { headers: supabaseHeaders, cache: 'no-store' });
      if (sbRes.ok) {
        const custs = await sbRes.json();
        if (Array.isArray(custs) && custs.length > 0) {
          customerRecord = custs[0];
          referralCode = customerRecord.referral_code || '';
        }
      }
    } catch(e) {}

    const resolvedPhone = phoneParam;
    const resolvedName = (customerRecord?.name || nameParam || 'Customer').trim();

    // 2. If customer has no referralCode yet, generate one from their real name & phone
    if (!referralCode && resolvedPhone) {
      const cleanName = resolvedName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'EYE';
      const last4 = resolvedPhone.slice(-4);
      referralCode = `EYE-${cleanName}${last4}`;

      // Persist to Supabase customers table if record exists
      if (customerRecord) {
        fetch(`${SUPABASE_URL}/rest/v1/customers?phone=eq.${resolvedPhone}`, {
          method: 'PATCH',
          headers: supabaseHeaders,
          body: JSON.stringify({ referral_code: referralCode })
        }).catch(() => {});
      }
    }

    // 3. Fetch vouchers belonging to this user from store & Supabase
    const cleanDigits = (resolvedPhone || '').replace(/[^0-9]/g, '').slice(-10);
    const last4Digits = cleanDigits.slice(-4);
    const earnedVoucherMap = new Map<string, any>();
    let userWelcomeVoucher: any = null;

    // Helper to format voucher object
    const formatVoucher = (v: any) => ({
      id: v.id,
      code: v.code,
      referrerPhone: v.referrerPhone || v.referrer_phone,
      referrerName: v.referrerName || v.referrer_name,
      referredPhone: v.referredPhone || v.referred_phone,
      referredName: v.referredName || v.referred_name,
      benefitType: v.benefitType || v.benefit_type,
      benefitValue: Number(v.benefitValue || v.benefit_value || 0),
      benefitTitle: v.benefitTitle || v.benefit_title,
      status: v.status,
      issuedAt: v.issuedAt || v.issued_at,
      expiresAt: v.expiresAt || v.expires_at,
      claimedAt: v.claimedAt || v.claimed_at,
      claimedChannel: v.claimedChannel || v.claimed_channel,
      claimedStoreLocation: v.claimedStoreLocation || v.claimed_store,
      claimedStaffName: v.claimedStaffName || v.claimed_by_staff,
      claimedInvoiceNo: v.claimedInvoiceNo || v.invoice_no
    });

    // Check in-memory vouchers
    (store.vouchers || []).forEach((rawV: any) => {
      const v = formatVoucher(rawV);
      const vRefPhone = (v.referrerPhone || '').replace(/[^0-9]/g, '').slice(-10);
      const vFrdPhone = (v.referredPhone || '').replace(/[^0-9]/g, '').slice(-10);
      const isWelcome = v.benefitType === 'FLAT_DISCOUNT' || (v.code && v.code.startsWith('REF-WELCOME'));

      if (isWelcome) {
        if ((vFrdPhone && vFrdPhone === cleanDigits) || (vRefPhone && vRefPhone === cleanDigits && vFrdPhone === cleanDigits)) {
          if (!userWelcomeVoucher || v.status === 'ACTIVE') {
            userWelcomeVoucher = v;
          }
        }
      } else {
        // Earned referral reward (Free Frame / % discount)
        const phoneMatch = cleanDigits && vRefPhone === cleanDigits;
        const nameMatch = resolvedName && resolvedName !== 'Customer' && v.referrerName && (
          v.referrerName.toLowerCase() === resolvedName.toLowerCase() ||
          v.referrerName.toLowerCase().includes(resolvedName.toLowerCase())
        );
        if (phoneMatch || nameMatch) {
          earnedVoucherMap.set(v.code, v);
        }
      }
    });

    // Also query Supabase referral_vouchers directly so fresh DB records are always loaded
    try {
      if (cleanDigits) {
        const sbVRes = await fetch(
          `${SUPABASE_URL}/rest/v1/referral_vouchers?select=*&or=(referrer_phone.eq.${cleanDigits},referred_phone.eq.${cleanDigits})`,
          { headers: supabaseHeaders, cache: 'no-store' }
        );
        if (sbVRes.ok) {
          const sbVRows = await sbVRes.json();
          if (Array.isArray(sbVRows)) {
            sbVRows.forEach((r: any) => {
              const v = formatVoucher(r);
              const rRefPhone = (v.referrerPhone || '').replace(/[^0-9]/g, '').slice(-10);
              const rFrdPhone = (v.referredPhone || '').replace(/[^0-9]/g, '').slice(-10);
              const isWelcome = v.benefitType === 'FLAT_DISCOUNT' || (v.code && v.code.startsWith('REF-WELCOME'));

              if (isWelcome) {
                if ((rFrdPhone && rFrdPhone === cleanDigits) || (rRefPhone && rRefPhone === cleanDigits && rFrdPhone === cleanDigits)) {
                  if (!userWelcomeVoucher || v.status === 'ACTIVE') {
                    userWelcomeVoucher = v;
                  }
                }
              } else {
                // Free Frame or Percent Discount reward earned by this referrer
                if (rRefPhone === cleanDigits) {
                  earnedVoucherMap.set(v.code, v);
                }
              }
            });
          }
        }
      }
    } catch(e) {}

    // Sort earned referral rewards so ACTIVE ones always appear first
    const userVouchers = Array.from(earnedVoucherMap.values()).sort((a: any, b: any) => {
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
      return new Date(b.issuedAt || 0).getTime() - new Date(a.issuedAt || 0).getTime();
    });

    // 4. Fetch all referred friends directly from Supabase customers table & vouchers
    const friendsMap = new Map<string, any>();

    try {
      const cleanCode = (referralCode || '').trim().toUpperCase();
      const codeWithoutPrefix = cleanCode.replace(/^EYE-/, '');
      const orConditions = [
        cleanCode ? `referred_by.eq.${encodeURIComponent(cleanCode)}` : '',
        cleanCode ? `referred_by.ilike.%25${encodeURIComponent(cleanCode)}%25` : '',
        codeWithoutPrefix ? `referred_by.ilike.%25${encodeURIComponent(codeWithoutPrefix)}%25` : '',
        cleanDigits ? `referred_by.like.%25${cleanDigits}` : '',
        resolvedName && resolvedName !== 'Customer' ? `referred_by.ilike.%25${encodeURIComponent(resolvedName)}%25` : ''
      ].filter(Boolean).join(',');

      if (orConditions) {
        const frndRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*&or=(${orConditions})`, {
          headers: supabaseHeaders,
          cache: 'no-store'
        });
        if (frndRes.ok) {
          const frndData = await frndRes.json();
          if (Array.isArray(frndData)) {
            frndData.forEach((c: any) => {
              const p = (c.phone || '').replace(/[^0-9]/g, '').slice(-10);
              if (p && p !== cleanDigits) {
                const vMatch = userVouchers.find((v: any) => (v.referredPhone || '').replace(/[^0-9]/g, '').slice(-10) === p);
                friendsMap.set(p, {
                  name: c.name || 'Friend',
                  phone: p,
                  joinedAt: c.created_at || new Date().toISOString(),
                  voucherCode: vMatch?.code || 'FREE-FRAME-ACTIVE',
                  status: vMatch?.status || 'ACTIVE'
                });
              }
            });
          }
        }
      }
    } catch(e) {}

    // Also include any friends recorded via referral vouchers
    userVouchers.forEach((v: any) => {
      const p = (v.referredPhone || '').replace(/[^0-9]/g, '').slice(-10);
      if (p && p !== cleanDigits && !friendsMap.has(p)) {
        friendsMap.set(p, {
          name: v.referredName || 'Friend',
          phone: p,
          joinedAt: v.issuedAt || new Date().toISOString(),
          voucherCode: v.code,
          status: v.status
        });
      }
    });

    const friends = Array.from(friendsMap.values());

    // 5. Target / Limit Calculation
    const requiredFriendsCount = Math.max(1, Number(store.config.requiredFriendsCount || 1));
    const totalFriends = friends.length;
    const eligibleRewards = Math.floor(totalFriends / requiredFriendsCount);
    const progressInCurrentCycle = totalFriends % requiredFriendsCount;
    const friendsNeededForNext = progressInCurrentCycle === 0 
      ? (totalFriends === 0 ? requiredFriendsCount : 0)
      : (requiredFriendsCount - progressInCurrentCycle);

    const target = {
      requiredFriendsCount,
      totalFriendsReferred: totalFriends,
      eligibleRewards,
      progressInCurrentCycle,
      friendsNeededForNext,
      isGoalReached: totalFriends >= requiredFriendsCount,
      progressPercent: requiredFriendsCount > 1 
        ? Math.min(100, Math.round(((progressInCurrentCycle || (totalFriends >= requiredFriendsCount ? requiredFriendsCount : 0)) / requiredFriendsCount) * 100))
        : 100
    };

    const memberTier = customerRecord?.membership_tier || 'none';

    return NextResponse.json({
      success: true,
      referralCode: referralCode || `EYE-${(resolvedPhone || '1234').slice(-4)}`,
      referralLink: `https://www.eyevengers.com/?ref=${referralCode || `EYE-${(resolvedPhone || '1234').slice(-4)}`}`,
      config: store.config,
      customer: {
        name: resolvedName,
        phone: resolvedPhone,
        membershipTier: memberTier,
        membershipBenefits: memberTier !== 'none' ? {
          discountPercent: memberTier === 'gold' ? 15 : memberTier === 'silver' ? 10 : 5,
          freeShipping: true,
          bogoOffer: memberTier === 'gold'
        } : undefined
      },
      target,
      stats: {
        totalReferred: Math.max(userVouchers.length, friends.length),
        activeRewardsCount: userVouchers.filter((v: any) => v.status === 'ACTIVE').length,
        claimedRewardsCount: userVouchers.filter((v: any) => v.status === 'CLAIMED').length
      },
      vouchers: userVouchers,
      welcomeVoucher: userWelcomeVoucher,
      friends
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
    const authHeader = req.headers.get('authorization');
    const referer = req.headers.get('referer') || '';
    if (!isValidAdminToken(authHeader) && !referer.includes('/admin')) {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }
    let allCustomers: any[] = [];
    try {
      const cRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*`, { headers: supabaseHeaders, cache: 'no-store' });
      if (cRes.ok) {
        allCustomers = await cRes.json();
      }
    } catch(e) {}

    const usersList = (allCustomers || []).map((c: any) => {
      const cPhoneDigits = (c.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const cRefCode = (c.referral_code || `EYE-${c.name?.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'EYE'}${c.phone?.slice(-4) || '1234'}`).trim().toUpperCase();

      // Find all friends in customers table who were referred by this customer
      const directFriends = (allCustomers || []).filter((f: any) => {
        if (f.id === c.id || f.phone === c.phone) return false;
        const refBy = (f.referred_by || '').trim().toUpperCase();
        return refBy && (refBy === cRefCode || refBy === cPhoneDigits || (c.name && refBy.includes(c.name.toUpperCase())));
      });

      // Find all vouchers for this customer
      const cVouchers = (store.vouchers || []).filter((v: any) => {
        const vPhone = (v.referrerPhone || '').replace(/[^0-9]/g, '').slice(-10);
        return vPhone && vPhone === cPhoneDigits;
      });

      // Merge friends list
      const friendMap = new Map<string, any>();
      directFriends.forEach((f: any) => {
        const p = (f.phone || '').slice(-10);
        friendMap.set(p, {
          name: f.name || 'Friend',
          phone: p,
          joinedAt: f.created_at || new Date().toISOString()
        });
      });
      cVouchers.forEach((v: any) => {
        const p = (v.referredPhone || '').slice(-10);
        if (p && p !== cPhoneDigits && !friendMap.has(p)) {
          friendMap.set(p, {
            name: v.referredName || 'Friend',
            phone: p,
            joinedAt: v.issuedAt || new Date().toISOString()
          });
        }
      });
      const friendsList = Array.from(friendMap.values());

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        referralCode: cRefCode,
        totalReferred: Math.max(friendsList.length, cVouchers.length),
        activeRewards: cVouchers.filter((v: any) => v.status === 'ACTIVE').length,
        claimedRewards: cVouchers.filter((v: any) => v.status === 'CLAIMED').length,
        friendsList,
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

      // Synchronize with gamification registry if this was a lucky game coupon
      try {
        const gsRes = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=eq.gamification_plays_registry&select=*`, {
          headers: supabaseHeaders,
          cache: 'no-store'
        });
        if (gsRes.ok) {
          const gsData = await gsRes.json();
          if (Array.isArray(gsData) && gsData.length > 0 && gsData[0].value) {
            const plays = JSON.parse(gsData[0].value);
            let hasGameUpdate = false;
            const updatedPlays = plays.map((p: any) => {
              if (p.couponCode?.toUpperCase() === voucher.code.toUpperCase() || (voucher.id && p.id === voucher.id)) {
                hasGameUpdate = true;
                return {
                  ...p,
                  status: 'CLAIMED',
                  claimedAt: voucher.claimedAt,
                  claimedChannel: 'STORE',
                  claimedStore: voucher.claimedStoreLocation,
                  claimedStaff: voucher.claimedStaffName,
                  invoiceNo: voucher.claimedInvoiceNo
                };
              }
              return p;
            });
            if (hasGameUpdate) {
              await fetch(`${SUPABASE_URL}/rest/v1/global_settings`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify({
                  key: 'gamification_plays_registry',
                  value: JSON.stringify(updatedPlays)
                })
              });
            }
          }
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: 'SUCCESS: Voucher has been marked as Claimed at Store. Code is now locked and cannot be reused.',
        voucher
      });
    }

    if (action === 'claim-online') {
      const { code, orderId, channel } = body;
      const voucher = store.vouchers.find((v: any) => v.code.toUpperCase() === (code || '').trim().toUpperCase());
      if (voucher && voucher.status === 'ACTIVE') {
        voucher.status = 'CLAIMED';
        voucher.claimedAt = new Date().toISOString();
        voucher.claimedChannel = channel || 'ONLINE';
        voucher.claimedInvoiceNo = orderId || 'ONLINE-ORDER';
        persistStore(store);
        updateVoucherInSupabase(voucher.code, {
          status: 'CLAIMED',
          claimed_at: voucher.claimedAt,
          claimed_channel: voucher.claimedChannel,
          invoice_no: voucher.claimedInvoiceNo
        });
      }
      return NextResponse.json({ success: true, voucher });
    }

    if (action === 'register-ref') {
      const { referralCode, friendPhone, friendName } = body;
      const cleanFriendPhone = (friendPhone || '').replace(/[^0-9]/g, '').slice(-10);
      const cleanRefCode = (referralCode || '').trim().toUpperCase();
      const codeWithoutPrefix = cleanRefCode.replace(/^EYE-/, '');

      // 1. Look up real referrer from Supabase customers table
      let referrer: any = null;
      try {
        const queryOr = [
          cleanRefCode ? `referral_code.eq.${encodeURIComponent(cleanRefCode)}` : '',
          cleanRefCode ? `referral_code.ilike.%25${encodeURIComponent(cleanRefCode)}%25` : '',
          codeWithoutPrefix ? `referral_code.ilike.%25${encodeURIComponent(codeWithoutPrefix)}%25` : ''
        ].filter(Boolean).join(',');

        const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*&or=(${queryOr})`, {
          headers: supabaseHeaders,
          cache: 'no-store'
        });
        if (sbRes.ok) {
          const custs = await sbRes.json();
          if (Array.isArray(custs) && custs.length > 0) {
            referrer = {
              phone: custs[0].phone,
              name: custs[0].name,
              referralCode: custs[0].referral_code
            };
          }
        }
      } catch(e) {}

      // 2. Fallback: match by phone if code is numeric or ends with digits
      if (!referrer) {
        const digits = cleanRefCode.replace(/[^0-9]/g, '');
        if (digits.length >= 4) {
          try {
            const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*&phone=like.%25${digits.slice(-4)}`, {
              headers: supabaseHeaders,
              cache: 'no-store'
            });
            if (sbRes.ok) {
              const custs = await sbRes.json();
              if (Array.isArray(custs) && custs.length > 0) {
                referrer = {
                  phone: custs[0].phone,
                  name: custs[0].name,
                  referralCode: custs[0].referral_code || cleanRefCode
                };
              }
            }
          } catch(e) {}
        }
      }

      // 3. Fallback: memory store
      if (!referrer) {
        const memoryRef = store.users.find((u: any) => u.referralCode?.toUpperCase() === cleanRefCode || u.referralCode?.toUpperCase().includes(codeWithoutPrefix));
        if (memoryRef) {
          referrer = memoryRef;
        } else {
          referrer = {
            phone: '8955499282',
            name: 'Valued Referrer',
            referralCode: cleanRefCode || 'EYE-REFERRAL',
            createdAt: new Date().toISOString()
          };
        }
      }

      // Proactively bind the friend's record in Supabase customers table
      if (cleanFriendPhone) {
        fetch(`${SUPABASE_URL}/rest/v1/customers?phone=eq.${cleanFriendPhone}`, {
          method: 'PATCH',
          headers: supabaseHeaders,
          body: JSON.stringify({ referred_by: referrer.referralCode || cleanRefCode })
        }).catch(() => {});
      }

      if (referrer.phone && referrer.phone.slice(-10) === cleanFriendPhone) {
        return NextResponse.json({ error: 'Self-referral is not permitted' }, { status: 400 });
      }

      const expiresAt = new Date(Date.now() + (store.config.validityDays || 60) * 86400000).toISOString();

      // Count total friends referred by this referrer so far (including this new one)
      let totalFriendsCount = 1;
      try {
        const frndCountRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=id&referred_by=eq.${encodeURIComponent(referrer.referralCode || cleanRefCode)}`, {
          headers: supabaseHeaders,
          cache: 'no-store'
        });
        if (frndCountRes.ok) {
          const frnds = await frndCountRes.json();
          totalFriendsCount = (Array.isArray(frnds) ? frnds.length : 0) + 1;
        }
      } catch(e) {}

      const requiredFriends = Math.max(1, Number(store.config.requiredFriendsCount || 1));
      const shouldIssueReferrerReward = (totalFriendsCount % requiredFriends === 0) || requiredFriends === 1;

      let referrerVoucher: any = null;
      if (shouldIssueReferrerReward) {
        // 1. Generate Referrer Reward Voucher (FREE FRAME or 30% OFF)
        const referrerVoucherCode = `REF-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        referrerVoucher = {
          id: `VOUCH-${Date.now()}-REF`,
          code: referrerVoucherCode,
          referrerPhone: (referrer.phone || '').replace(/[^0-9]/g, '').slice(-10),
          referrerName: referrer.name,
          referredPhone: cleanFriendPhone,
          referredName: friendName || 'New Friend',
          benefitType: store.config.rewardType || 'FREE_FRAME',
          benefitValue: store.config.rewardValue || 100,
          benefitTitle: store.config.rewardTitle || 'FREE Eyevengers Frame (or 30% OFF)',
          status: 'ACTIVE',
          issuedAt: new Date().toISOString(),
          expiresAt,
        };
        store.vouchers.unshift(referrerVoucher);
        saveVoucherToSupabase(referrerVoucher);
      }

      // 2. Generate Friend Welcome Voucher (Flat ₹200 OFF on First Purchase)
      const friendVoucherCode = `REF-WELCOME-${Math.floor(1000 + Math.random() * 9000)}`;
      const friendVoucher = {
        id: `VOUCH-${Date.now()}-FRD`,
        code: friendVoucherCode,
        referrerPhone: (referrer.phone || '').replace(/[^0-9]/g, '').slice(-10),
        referrerName: referrer.name,
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
      saveVoucherToSupabase(friendVoucher);

      persistStore(store);

      return NextResponse.json({ 
        success: true, 
        message: shouldIssueReferrerReward 
          ? 'Referral registered successfully! Rewards generated for both Referrer and Friend.'
          : `Referral registered! ${totalFriendsCount} / ${requiredFriends} friends joined.`,
        voucher: referrerVoucher,
        friendVoucher,
        target: {
          totalFriendsCount,
          requiredFriends,
          isRewardUnlocked: shouldIssueReferrerReward
        }
      });
    }

    if (action === 'update-config') {
      store.config = { ...store.config, ...body.config };
      if (body.config?.requiredFriendsCount !== undefined) {
        store.config.requiredFriendsCount = Math.max(1, Number(body.config.requiredFriendsCount));
      }
      persistStore(store);
      await saveConfigToSupabase(store.config);
      return NextResponse.json({ success: true, config: store.config });
    }


    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
