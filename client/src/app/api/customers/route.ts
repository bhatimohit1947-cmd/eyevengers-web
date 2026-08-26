import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic'; // Prevent Next.js from statically caching this route

// Use the OS temp directory for persistence across Next.js reloads on Render
const DB_PATH = path.join(os.tmpdir(), 'eyevengers_mock_customers.json');

const readDB = () => {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to read mock DB:", error);
  }
  return [];
};

const writeDB = (data: any) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write mock DB:", error);
  }
};

export async function GET() {
  const customers = readDB();
  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  try {
    const customer = await request.json();
    const customers = readDB();
    
    // Check if phone already exists
    const existingIndex = customers.findIndex((c: any) => c.phone === customer.phone);
    
    if (existingIndex >= 0) {
      // Update existing
      customers[existingIndex] = {
        ...customers[existingIndex],
        ...customer,
      };
    } else {
      // Create new
      customers.push({
        id: customer.id || `CUST-${Date.now()}`,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        pin: customer.pin,
        joinedAt: customer.joinedAt || new Date().toISOString(),
        createdAt: customer.createdAt || new Date().toISOString()
      });
    }

    writeDB(customers);

    return NextResponse.json({ success: true, customer: customers.find((c: any) => c.phone === customer.phone) });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
