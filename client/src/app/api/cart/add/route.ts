import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { productId, lensConfig, qty } = await request.json();
    
    if (!productId || !qty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Simulate backend processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({ success: true, message: 'Added to cart successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
