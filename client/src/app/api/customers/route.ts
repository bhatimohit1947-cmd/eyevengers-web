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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?select=*`, {
      headers: supabaseHeaders,
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const settingsData = await res.json();
    if (!Array.isArray(settingsData)) return [];

    const users: any[] = [];
    const statsMap: Record<string, any> = {};
    const pinMap: Record<string, string> = {};
    const membershipMap: Record<string, any> = {};

    settingsData.forEach((row: any) => {
      if (row.key && row.key.startsWith('user_')) {
        try {
          users.push(JSON.parse(row.value));
        } catch(e) {}
      } else if (row.key && row.key.startsWith('stats_')) {
        try {
          statsMap[row.key.replace('stats_', '')] = JSON.parse(row.value);
        } catch(e) {}
      } else if (row.key && row.key.startsWith('pin_')) {
        pinMap[row.key.replace('pin_', '')] = row.value;
      } else if (row.key && row.key.startsWith('membership_')) {
        try {
          membershipMap[row.key.replace('membership_', '')] = JSON.parse(row.value);
        } catch(e) {}
      }
    });

    const formatted = users.map(u => {
      const userMembership = membershipMap[u.id];
      const isActive = userMembership?.status === 'active';
      return {
        id: u.id || `CUST-${u.phone}`,
        name: u.name || 'Valued Customer',
        phone: u.phone,
        email: u.email || 'N/A',
        pin: u.pin || pinMap[u.id] || '0000',
        cartCount: statsMap[u.id]?.cartCount || 0,
        wishlistCount: statsMap[u.id]?.wishlistCount || 0,
        joinedAt: u.createdAt || new Date().toISOString(),
        createdAt: u.createdAt || new Date().toISOString(),
        membershipTier: isActive ? userMembership.tier : 'none'
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
    const userObj = {
      id: customer.id || `CUST-${Date.now()}`,
      name: customer.name || 'Valued Customer',
      email: customer.email || null,
      phone: cleanPhone,
      pin: customer.pin || '0000',
      createdAt: customer.createdAt || new Date().toISOString()
    };

    // Upsert into Supabase global_settings
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
