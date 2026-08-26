import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(os.tmpdir(), 'eyevengers_mock_customers.json');

const readDB = () => {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
  } catch (error) {}
  return [];
};

const writeDB = (data: any) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {}
};

export async function POST(request: Request) {
  try {
    const { id, cartCount, wishlistCount } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const customers = readDB();
    const idx = customers.findIndex((c: any) => c.id === id);
    if (idx >= 0) {
      if (cartCount !== undefined) customers[idx].cartCount = cartCount;
      if (wishlistCount !== undefined) customers[idx].wishlistCount = wishlistCount;
      writeDB(customers);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
