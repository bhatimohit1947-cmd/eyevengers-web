import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = 'https://bhjfsthxmzqumajquyvn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fvqOImRG-8kMsfQxln9WMw_JmBmCmNy';

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates'
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneParam = searchParams.get('phone');
    if (!phoneParam) {
      return NextResponse.json({ success: false, error: 'Phone number required' }, { status: 400 });
    }

    const cleanPhone = phoneParam.replace(/[^0-9]/g, '').slice(-10);
    if (!cleanPhone) {
      return NextResponse.json({ success: true, cart: { items: [], totalCount: 0, totalPrice: 0 } });
    }

    // 1. Try dedicated customer_carts table
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/customer_carts?customer_phone=eq.${cleanPhone}`, {
        headers: supabaseHeaders,
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const row = data[0];
          return NextResponse.json({
            success: true,
            cart: {
              items: Array.isArray(row.items) ? row.items : [],
              totalCount: Number(row.total_count ?? 0),
              totalPrice: Number(row.total_price ?? 0)
            }
          });
        }
      }
    } catch (e) {}

    // 2. Seamless fallback: global_settings
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=eq.cart_${cleanPhone}`, {
        headers: supabaseHeaders,
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const parsed = JSON.parse(data[0].value);
          return NextResponse.json({
            success: true,
            cart: {
              items: Array.isArray(parsed.items) ? parsed.items : [],
              totalCount: Number(parsed.totalCount ?? 0),
              totalPrice: Number(parsed.totalPrice ?? 0)
            }
          });
        }
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      cart: { items: [], totalCount: 0, totalPrice: 0 }
    });
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body.phone || body.customer_phone;
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    const items = Array.isArray(body.items) ? body.items : [];
    const totalCount = items.reduce((sum: number, i: any) => sum + (Number(i.qty) || 1), 0);
    const totalPrice = items.reduce((sum: number, i: any) => sum + ((Number(i.price) || 0) * (Number(i.qty) || 1)), 0);

    const cartPayload = {
      items,
      totalCount,
      totalPrice,
      updatedAt: new Date().toISOString()
    };

    // 1. Try saving to dedicated customer_carts table
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/customer_carts`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          customer_phone: cleanPhone,
          items,
          total_count: totalCount,
          total_price: totalPrice,
          updated_at: new Date().toISOString()
        })
      });
    } catch (e) {}

    // 2. Always persist to global_settings for guaranteed 100% cloud sync
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/global_settings`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          key: `cart_${cleanPhone}`,
          value: JSON.stringify(cartPayload)
        })
      });
    } catch (e) {}

    // 3. Update customers table cart_count
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/customers?phone=eq.${cleanPhone}`, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({
          cart_count: totalCount,
          updated_at: new Date().toISOString()
        })
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      cart: { items, totalCount, totalPrice }
    });
  } catch (error: any) {
    console.error('Error saving cart:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneParam = searchParams.get('phone');
    if (!phoneParam) {
      return NextResponse.json({ success: false, error: 'Phone number required' }, { status: 400 });
    }

    const cleanPhone = phoneParam.replace(/[^0-9]/g, '').slice(-10);

    // Delete from customer_carts
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/customer_carts?customer_phone=eq.${cleanPhone}`, {
        method: 'DELETE',
        headers: supabaseHeaders
      });
    } catch (e) {}

    // Clear in global_settings
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=eq.cart_${cleanPhone}`, {
        method: 'DELETE',
        headers: supabaseHeaders
      });
    } catch (e) {}

    // Reset customer cart_count
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/customers?phone=eq.${cleanPhone}`, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({ cart_count: 0 })
      });
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'Cart cleared' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
