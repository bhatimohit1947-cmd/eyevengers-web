import { NextResponse } from 'next/server';

export async function GET() {
  const plans = [
    {
      id: 'gold_1yr',
      name: 'Gold Membership',
      price: 600,
      durationMonths: 12,
      benefits: [
        'Buy 1 Get 1 Free on all categories',
        'Share benefits with 2 family members',
        'Free Shipping on every order',
        'Early access to sales'
      ]
    }
  ];

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  return NextResponse.json({ plans });
}
