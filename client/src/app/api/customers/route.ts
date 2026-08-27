import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FALLBACK_DB_PATH = path.join(process.cwd(), 'mock_customers.json');

const getFallbackCustomers = () => {
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      return JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, 'utf-8'));
    }
  } catch (e) {}
  return [];
};

const saveFallbackCustomer = (customer: any) => {
  try {
    const customers = getFallbackCustomers();
    const idx = customers.findIndex((c: any) => c.phone === customer.phone);
    if (idx >= 0) {
      customers[idx] = { ...customers[idx], ...customer };
    } else {
      customers.push(customer);
    }
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(customers, null, 2));
  } catch (e) {}
};

export async function GET() {
  let backendCustomers = [];
  try {
    const res = await fetch('https://eyevengers-web.onrender.com/api/admin/customers');
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
