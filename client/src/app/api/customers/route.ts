import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = 'https://bhjfsthxmzqumajquyvn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fvqOImRG-8kMsfQxln9WMw_JmBmCmNy';

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

const FALLBACK_DB_PATH = path.join(process.cwd(), 'mock_customers.json');

// Vercel Serverless In-Memory Cache Fallback
if (!(globalThis as any).mockCustomers) {
  (globalThis as any).mockCustomers = [];
}

const getFallbackCustomers = () => {
  let fsCustomers = [];
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      fsCustomers = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, 'utf-8'));
    }
  } catch (e) {}
  
  // Merge fs and memory
  const map = new Map();
  fsCustomers.forEach((c: any) => map.set(c.phone, c));
  (globalThis as any).mockCustomers.forEach((c: any) => map.set(c.phone, c));
  return Array.from(map.values());
};

const saveFallbackCustomer = (customer: any) => {
  // Save to memory
  const memoryCustomers = (globalThis as any).mockCustomers;
  const memIdx = memoryCustomers.findIndex((c: any) => c.phone === customer.phone);
  if (memIdx >= 0) memoryCustomers[memIdx] = { ...memoryCustomers[memIdx], ...customer };
  else memoryCustomers.push(customer);

  // Save to FS
  try {
    const fsCustomers = getFallbackCustomers();
    const idx = fsCustomers.findIndex((c: any) => c.phone === customer.phone);
    if (idx >= 0) {
      fsCustomers[idx] = { ...fsCustomers[idx], ...customer };
    } else {
      fsCustomers.push(customer);
    }
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(fsCustomers, null, 2));
  } catch (e) {}
};

async function fetchSupabaseCustomers() {
  try {
    const usersMap = new Map<string, any>();

    // 1. Primary: Fetch directly from dedicated 'customers' Supabase table
    try {
      const custRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*`, {
        headers: supabaseHeaders,
        cache: 'no-store'
      });
      if (custRes.ok) {
        const custData = await custRes.json();
        if (Array.isArray(custData)) {
          custData.forEach((c: any) => {
            if (c.phone) {
              const cleanPhone = c.phone.replace(/[^0-9]/g, '').slice(-10);
              usersMap.set(cleanPhone, {
                id: c.id || `CUST-${cleanPhone}`,
                name: c.name || 'Valued Customer',
                phone: cleanPhone,
                email: c.email || 'N/A',
                pin: c.pin || '0000',
                cartCount: c.cart_count || 0,
                wishlistCount: c.wishlist_count || 0,
                membershipTier: c.membership_tier || 'none',
                referralCode: c.referral_code,
                referredBy: c.referred_by,
                createdAt: c.created_at || new Date().toISOString(),
                joinedAt: c.created_at || new Date().toISOString()
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Dedicated customers table not ready or error, checking global_settings...', e);
    }

    // 2. Fetch from global_settings (Legacy & metadata sync)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?select=*`, {
      headers: supabaseHeaders,
      cache: 'no-store'
    });
    
    let settingsData: any[] = [];
    if (res.ok) {
      settingsData = await res.json();
    }

    const statsMap: Record<string, any> = {};
    const pinMap: Record<string, string> = {};
    const membershipMap: Record<string, any> = {};
    const phoneToIdMap: Record<string, string[]> = {};
    const idToPhoneMap: Record<string, string> = {};
    const phoneToMembershipMap: Record<string, any> = {};

    if (Array.isArray(settingsData)) {
      settingsData.forEach((row: any) => {
        if (row.key && row.key.startsWith('user_')) {
          try {
            const u = JSON.parse(row.value);
            if (u && u.phone) {
              const cleanPhone = u.phone.replace(/[^0-9]/g, '').slice(-10);
              if (u.id) {
                idToPhoneMap[u.id] = cleanPhone;
                if (!phoneToIdMap[cleanPhone]) phoneToIdMap[cleanPhone] = [];
                phoneToIdMap[cleanPhone].push(u.id);
              }
              if (!usersMap.has(cleanPhone)) {
                usersMap.set(cleanPhone, {
                  id: u.id || `CUST-${cleanPhone}`,
                  name: u.name || 'Valued Customer',
                  phone: cleanPhone,
                  email: u.email || 'N/A',
                  pin: u.pin || '0000',
                  membershipTier: u.membership_tier || u.membershipTier || 'none',
                  createdAt: u.createdAt || new Date().toISOString(),
                  joinedAt: u.createdAt || new Date().toISOString()
                });
              }
            }
          } catch(e) {}
        } else if (row.key && row.key.startsWith('stats_')) {
          try {
            statsMap[row.key.replace('stats_', '')] = JSON.parse(row.value);
          } catch(e) {}
        } else if (row.key && row.key.startsWith('pin_')) {
          pinMap[row.key.replace('pin_', '')] = row.value;
        } else if (row.key && row.key.startsWith('membership_')) {
          try {
            const memId = row.key.replace('membership_', '');
            const memObj = JSON.parse(row.value);
            membershipMap[memId] = memObj;
            if (memObj.user_id) membershipMap[memObj.user_id] = memObj;
            
            // Map via idToPhoneMap
            const phone = idToPhoneMap[memId] || (memObj.user_id ? idToPhoneMap[memObj.user_id] : null);
            if (phone) {
              phoneToMembershipMap[phone] = memObj;
              membershipMap[phone] = memObj;
              membershipMap[`CUST-${phone}`] = memObj;
            }
          } catch(e) {}
        }
      });
    }

    // 3. Also extract customers from orders so no ordering customer is ever missed
    try {
      const ordersRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*`, {
        headers: supabaseHeaders,
        cache: 'no-store'
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (Array.isArray(ordersData)) {
          ordersData.forEach((o: any) => {
            const phone = o.details?.userPhone || o.details?.phone;
            const name = o.details?.customerName || o.details?.name;
            if (phone) {
              const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
              if (cleanPhone.length === 10 && !usersMap.has(cleanPhone)) {
                usersMap.set(cleanPhone, {
                  id: o.details?.address?.userId || `CUST-${cleanPhone}`,
                  name: name || 'Customer',
                  phone: cleanPhone,
                  email: o.details?.email || 'N/A',
                  pin: '0000',
                  createdAt: o.created_at || new Date().toISOString(),
                  joinedAt: o.created_at || new Date().toISOString()
                });
              }
            }
          });
        }
      }
    } catch (e) {}

    const formatted = Array.from(usersMap.values()).map(u => {
      const cleanPhone = (u.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const userMembership = membershipMap[u.id]
        || membershipMap[cleanPhone]
        || membershipMap[`CUST-${cleanPhone}`]
        || phoneToMembershipMap[cleanPhone]
        || (phoneToIdMap[cleanPhone]?.map(id => membershipMap[id]).find(m => m?.status === 'active'));
      const isActive = userMembership?.status === 'active';
      return {
        id: u.id || `CUST-${u.phone}`,
        name: u.name || 'Valued Customer',
        phone: u.phone,
        email: u.email || 'N/A',
        pin: u.pin || pinMap[u.id] || '0000',
        cartCount: u.cartCount || statsMap[u.id]?.cartCount || 0,
        wishlistCount: u.wishlistCount || statsMap[u.id]?.wishlistCount || 0,
        joinedAt: u.createdAt || u.joinedAt || new Date().toISOString(),
        createdAt: u.createdAt || u.joinedAt || new Date().toISOString(),
        membershipTier: isActive ? userMembership.tier : (u.membershipTier && u.membershipTier !== 'none' ? u.membershipTier : 'none'),
        referralCode: u.referralCode,
        referredBy: u.referredBy
      };
    });

    formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return formatted;
  } catch (e) {
    console.error('Supabase customer fetch error:', e);
    return [];
  }
}

async function saveCustomerToSupabase(customer: any) {
  try {
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '').slice(-10);
    if (!cleanPhone) return null;

    const userKey = `user_${cleanPhone}`;
    const custId = customer.id || `CUST-${cleanPhone}`;
    const userObj = {
      id: custId,
      name: customer.name || 'Valued Customer',
      email: customer.email || null,
      phone: cleanPhone,
      pin: customer.pin || '0000',
      membership_tier: customer.membershipTier || customer.membership_tier || 'none',
      cart_count: customer.cartCount ?? customer.cart_count ?? 0,
      wishlist_count: customer.wishlistCount ?? customer.wishlist_count ?? 0,
      referral_code: customer.referralCode || customer.referral_code || null,
      referred_by: customer.referredBy || customer.referred_by || null,
      created_at: customer.createdAt || customer.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Save directly into dedicated 'customers' Supabase table
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/customers`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(userObj)
      });
    } catch (e) {
      console.warn('Dedicated customers table insert failed, falling back to global_settings', e);
    }

    // 2. Also save into global_settings as backwards-compatible fallback
    await fetch(`${SUPABASE_URL}/rest/v1/global_settings`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        key: userKey,
        value: JSON.stringify(userObj)
      })
    });

    if (customer.pin) {
      await fetch(`${SUPABASE_URL}/rest/v1/global_settings`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          key: `pin_${userObj.id}`,
          value: customer.pin
        })
      });
    }

    return userObj;
  } catch (e) {
    console.error('Supabase customer save error:', e);
    return null;
  }
}

export async function GET() {
  // 1. First fetch directly from Supabase (Source of Truth)
  const supabaseCustomers = await fetchSupabaseCustomers();

  // 2. Fetch from Fallback / Memory
  const fallbackCustomers = getFallbackCustomers();
  
  // Merge intelligently (avoid duplicates by 10-digit phone)
  const map = new Map();
  fallbackCustomers.forEach((c: any) => {
    if (c.phone) map.set(c.phone.slice(-10), c);
  });
  supabaseCustomers.forEach((c: any) => {
    if (c.phone) map.set(c.phone.slice(-10), c);
  });
  
  const allCustomers = Array.from(map.values());
  allCustomers.sort((a, b) => new Date(b.createdAt || b.joinedAt || 0).getTime() - new Date(a.createdAt || a.joinedAt || 0).getTime());

  return NextResponse.json(allCustomers);
}

export async function POST(request: Request) {
  try {
    const customer = await request.json();
    
    // 1. Save locally as immediate fallback
    saveFallbackCustomer(customer);

    // 2. Save directly to Supabase
    const savedUser = await saveCustomerToSupabase(customer);

    return NextResponse.json({ 
      success: true, 
      customer: savedUser || customer, 
      message: 'Saved to Supabase database successfully' 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
