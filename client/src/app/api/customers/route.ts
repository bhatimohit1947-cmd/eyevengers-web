import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

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

export async function GET() {
  let backendCustomers = [];
  try {
    const res = await fetch('https://eyevengers-web.onrender.com/api/admin/customers', { cache: 'no-store' });
    if (res.ok) backendCustomers = await res.json();
  } catch (error) {}

  const fallbackCustomers = getFallbackCustomers();
  
  // Merge backend and fallback (avoid duplicates by phone)
  const map = new Map();
  fallbackCustomers.forEach((c: any) => map.set(c.phone, c));
  backendCustomers.forEach((c: any) => map.set(c.phone, c));
  
  return NextResponse.json(Array.from(map.values()));
}

export async function POST(request: Request) {
  try {
    const customer = await request.json();
    
    // Always save locally as a fallback
    saveFallbackCustomer(customer);

    try {
      const res = await fetch('https://eyevengers-web.onrender.com/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
      
      if (!res.ok) {
        return NextResponse.json({ success: true, customer, warning: 'Backend unavailable, saved locally' });
      }

      const data = await res.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      return NextResponse.json({ success: true, customer, warning: 'Backend fetch failed, saved locally' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
