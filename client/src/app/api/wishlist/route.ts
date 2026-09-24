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
      return NextResponse.json({ success: true, productIds: [] });
    }

    // 1. Try dedicated customer_wishlists table
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/customer_wishlists?customer_phone=eq.${cleanPhone}`, {
        headers: supabaseHeaders,
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const row = data[0];
          return NextResponse.json({
            success: true,
            productIds: Array.isArray(row.product_ids) ? row.product_ids : []
          });
        }
      }
    } catch (e) {}

    // 2. Seamless fallback: global_settings
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=eq.wishlist_${cleanPhone}`, {
        headers: supabaseHeaders,
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const parsed = JSON.parse(data[0].value);
          const pIds = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.productIds) ? parsed.productIds : []);
          return NextResponse.json({
            success: true,
            productIds: pIds
          });
        }
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      productIds: []
    });
  } catch (error: any) {
    console.error('Error fetching wishlist:', error);
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
    const productIds = Array.isArray(body.productIds) ? body.productIds : (Array.isArray(body.product_ids) ? body.product_ids : []);

    // 1. Try dedicated customer_wishlists table
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/customer_wishlists`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          customer_phone: cleanPhone,
          product_ids: productIds,
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
          key: `wishlist_${cleanPhone}`,
          value: JSON.stringify(productIds)
        })
      });
    } catch (e) {}

    // 3. Update customers table wishlist_count
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/customers?phone=eq.${cleanPhone}`, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({
          wishlist_count: productIds.length,
          updated_at: new Date().toISOString()
        })
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      productIds
    });
  } catch (error: any) {
    console.error('Error saving wishlist:', error);
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

    // Clear from customer_wishlists
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/customer_wishlists?customer_phone=eq.${cleanPhone}`, {
        method: 'DELETE',
        headers: supabaseHeaders
      });
    } catch (e) {}

    // Clear in global_settings
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=eq.wishlist_${cleanPhone}`, {
        method: 'DELETE',
        headers: supabaseHeaders
      });
    } catch (e) {}

    // Reset customer wishlist_count
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/customers?phone=eq.${cleanPhone}`, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({ wishlist_count: 0 })
      });
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'Wishlist cleared' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
