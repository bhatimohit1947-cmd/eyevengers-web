import { NextResponse } from 'next/server';

// Use a global variable to persist data across API calls in the same server instance
// Next.js dev server might clear this on hot-reloads, but it will work perfectly in production/running state.
if (!(global as any).mockCustomers) {
  (global as any).mockCustomers = [];
}

export async function GET() {
  return NextResponse.json((global as any).mockCustomers);
}

export async function POST(request: Request) {
  try {
    const customer = await request.json();
    
    // Check if phone already exists
    const existingIndex = (global as any).mockCustomers.findIndex((c: any) => c.phone === customer.phone);
    
    if (existingIndex >= 0) {
      // Update existing
      (global as any).mockCustomers[existingIndex] = {
        ...(global as any).mockCustomers[existingIndex],
        ...customer,
      };
    } else {
      // Create new
      (global as any).mockCustomers.push({
        id: customer.id || `CUST-${Date.now()}`,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        pin: customer.pin,
        joinedAt: customer.joinedAt || new Date().toISOString(),
        createdAt: customer.createdAt || new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, customer: (global as any).mockCustomers.find((c: any) => c.phone === customer.phone) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
