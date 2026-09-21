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

const updateFallbackStats = (id: string, cartCount?: number, wishlistCount?: number) => {
  const memCustomers = (globalThis as any).mockCustomers;
  const memIdx = memCustomers.findIndex((c: any) => c.id === id);
  if (memIdx >= 0) {
    if (cartCount !== undefined) memCustomers[memIdx].cartCount = cartCount;
    if (wishlistCount !== undefined) memCustomers[memIdx].wishlistCount = wishlistCount;
  }

  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      const customers = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, 'utf-8'));
      const idx = customers.findIndex((c: any) => c.id === id);
      if (idx >= 0) {
        if (cartCount !== undefined) customers[idx].cartCount = cartCount;
        if (wishlistCount !== undefined) customers[idx].wishlistCount = wishlistCount;
        fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(customers, null, 2));
      }
    }
  } catch (e) {}
};

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (data.id) {
      updateFallbackStats(data.id, data.cartCount, data.wishlistCount);

      // Save directly to Supabase global_settings
      try {
        const statsKey = `stats_${data.id}`;
        await fetch(`${SUPABASE_URL}/rest/v1/global_settings`, {
          method: 'POST',
          headers: {
            ...supabaseHeaders,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            key: statsKey,
            value: JSON.stringify({
              cartCount: data.cartCount || 0,
              wishlistCount: data.wishlistCount || 0
            })
          })
        });
      } catch (e) {}
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
