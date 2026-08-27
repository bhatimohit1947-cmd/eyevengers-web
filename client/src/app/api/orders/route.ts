import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FALLBACK_DB_PATH = path.join(process.cwd(), 'mock_orders.json');

// Vercel Serverless In-Memory Cache Fallback
if (!(globalThis as any).mockOrders) {
  (globalThis as any).mockOrders = [];
}

const getFallbackOrders = () => {
  let fsOrders = [];
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      fsOrders = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, 'utf-8'));
    }
  } catch (e) {}
  
  // Merge fs and memory
  const map = new Map();
  fsOrders.forEach((o: any) => map.set(o.id, o));
  (globalThis as any).mockOrders.forEach((o: any) => map.set(o.id, o));
  return Array.from(map.values());
};

const saveFallbackOrder = (order: any) => {
  // Save to memory
  const memoryOrders = (globalThis as any).mockOrders;
  const memIdx = memoryOrders.findIndex((o: any) => o.id === order.id);
  if (memIdx >= 0) memoryOrders[memIdx] = { ...memoryOrders[memIdx], ...order };
  else memoryOrders.push(order);

  // Save to FS
  try {
    const fsOrders = getFallbackOrders();
    const idx = fsOrders.findIndex((o: any) => o.id === order.id);
    if (idx >= 0) {
      fsOrders[idx] = { ...fsOrders[idx], ...order };
    } else {
      fsOrders.push(order);
    }
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(fsOrders, null, 2));
  } catch (e) {}
};

export async function GET() {
  let backendOrders = [];
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  
  try {
    const res = await fetch('https://eyevengers-web.onrender.com/api/orders', {
      signal: controller.signal
    });
    if (res.ok) backendOrders = await res.json();
  } catch (error) {
    // Ignore timeout errors
  } finally {
    clearTimeout(timeoutId);
  }

  const fallbackOrders = getFallbackOrders();
  
  // Merge backend and fallback (avoid duplicates by id)
  const map = new Map();
  fallbackOrders.forEach((o: any) => map.set(o.id, o));
  backendOrders.forEach((o: any) => map.set(o.id, o));
  
  return NextResponse.json(Array.from(map.values()));
}

export async function POST(request: Request) {
  try {
    const order = await request.json();
    
    // Always save locally as a fallback
    saveFallbackOrder(order);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch('https://eyevengers-web.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        return NextResponse.json({ success: true, order, warning: 'Backend unavailable, saved locally' });
      }

      const data = await res.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return NextResponse.json({ success: true, order, warning: 'Backend fetch failed, saved locally' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
