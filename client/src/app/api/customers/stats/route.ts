import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const res = await fetch('https://eyevengers-web.onrender.com/api/admin/customers/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const responseData = await res.json();
    return NextResponse.json(responseData);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
