import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FALLBACK_DB_PATH = path.join(process.cwd(), 'mock_orders.json');

const updateFallbackStatus = (orderId: string, status: string) => {
  // Update in memory
  const memoryOrders = (globalThis as any).mockOrders || [];
  const memIdx = memoryOrders.findIndex((o: any) => o.id === orderId);
  if (memIdx >= 0) {
    memoryOrders[memIdx].status = status;
  }

  // Update in FS
  try {
    let fsOrders = [];
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      fsOrders = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, 'utf-8'));
    }
    const idx = fsOrders.findIndex((o: any) => o.id === orderId);
    if (idx >= 0) {
      fsOrders[idx].status = status;
      fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(fsOrders, null, 2));
    }
  } catch (e) {}
};

export async function PUT(request: Request, { params }: { params: { orderId: string } }) {
  try {
    const { status } = await request.json();
    const orderId = params.orderId;

    // Update Vercel fallback
    updateFallbackStatus(orderId, status);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        return NextResponse.json({ success: true, warning: 'Backend unavailable, status updated locally' });
      }

      const data = await res.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return NextResponse.json({ success: true, warning: 'Backend fetch failed, status updated locally' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
