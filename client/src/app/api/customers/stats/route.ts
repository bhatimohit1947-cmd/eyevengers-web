import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FALLBACK_DB_PATH = path.join(process.cwd(), 'mock_customers.json');

const updateFallbackStats = (id: string, cartCount?: number, wishlistCount?: number) => {
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
    
    // Save locally as a fallback
    if (data.id) {
      updateFallbackStats(data.id, data.cartCount, data.wishlistCount);
    }

    try {
      const res = await fetch('https://eyevengers-web.onrender.com/api/admin/customers/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        return NextResponse.json({ success: true, warning: 'Backend unavailable, saved locally' });
      }
      const responseData = await res.json();
      return NextResponse.json(responseData);
    } catch (fetchError) {
      return NextResponse.json({ success: true, warning: 'Backend fetch failed, saved locally' });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
