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
    const addressMap = new Map<string, any>();

    // 1. Fetch from Supabase customer_addresses table
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/customer_addresses?customer_phone=eq.${cleanPhone}&order=created_at.desc`, {
        headers: supabaseHeaders,
        cache: 'no-store'
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          rows.forEach((r: any) => {
            addressMap.set(r.id, {
              id: r.id,
              userId: cleanPhone,
              name: r.recipient_name || 'Customer',
              street: r.address_line || '',
              city: r.city || '',
              state: r.state || '',
              pincode: r.pincode || '',
              label: r.label || 'Home',
              isDefault: Boolean(r.is_default)
            });
          });
        }
      }
    } catch (e) {}

    // 2. Fetch from global_settings fallback
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=eq.addresses_${cleanPhone}`, {
        headers: supabaseHeaders,
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const list = JSON.parse(data[0].value);
          if (Array.isArray(list)) {
            list.forEach((a: any) => {
              if (!addressMap.has(a.id)) {
                addressMap.set(a.id, {
                  ...a,
                  userId: cleanPhone
                });
              }
            });
          }
        }
      }
    } catch (e) {}

    const addresses = Array.from(addressMap.values());
    return NextResponse.json({ success: true, addresses });
  } catch (error: any) {
    console.error('Error fetching addresses:', error);
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
    const addr = body.address || body;
    const addrId = addr.id || `ADDR-${Date.now()}`;
    const isDefault = Boolean(addr.isDefault || addr.is_default);

    const formattedAddress = {
      id: addrId,
      userId: cleanPhone,
      name: addr.name || addr.recipient_name || 'Customer',
      street: addr.street || addr.address_line || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      label: addr.label || 'Home',
      isDefault
    };

    // If marked default, unset other defaults in customer_addresses
    if (isDefault) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/customer_addresses?customer_phone=eq.${cleanPhone}`, {
          method: 'PATCH',
          headers: supabaseHeaders,
          body: JSON.stringify({ is_default: false })
        });
      } catch (e) {}
    }

    // 1. Save to dedicated customer_addresses table
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/customer_addresses`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          id: addrId,
          customer_phone: cleanPhone,
          recipient_name: formattedAddress.name,
          address_line: formattedAddress.street,
          city: formattedAddress.city,
          state: formattedAddress.state,
          pincode: formattedAddress.pincode,
          label: formattedAddress.label,
          is_default: isDefault,
          created_at: new Date().toISOString()
        })
      });
    } catch (e) {}

    // 2. Always persist to global_settings list for guaranteed backup
    try {
      let currentList: any[] = [];
      const getRes = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=eq.addresses_${cleanPhone}`, {
        headers: supabaseHeaders,
        cache: 'no-store'
      });
      if (getRes.ok) {
        const d = await getRes.json();
        if (Array.isArray(d) && d.length > 0) {
          try { currentList = JSON.parse(d[0].value); } catch(e) {}
        }
      }

      if (isDefault) {
        currentList.forEach(a => a.isDefault = false);
      }

      const existingIdx = currentList.findIndex(a => a.id === addrId);
      if (existingIdx >= 0) {
        currentList[existingIdx] = formattedAddress;
      } else {
        currentList.push(formattedAddress);
      }

      await fetch(`${SUPABASE_URL}/rest/v1/global_settings`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          key: `addresses_${cleanPhone}`,
          value: JSON.stringify(currentList)
        })
      });
    } catch (e) {}

    return NextResponse.json({ success: true, address: formattedAddress });
  } catch (error: any) {
    console.error('Error saving address:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const phoneParam = searchParams.get('phone');
    if (!id || !phoneParam) {
      return NextResponse.json({ success: false, error: 'Address id and phone required' }, { status: 400 });
    }

    const cleanPhone = phoneParam.replace(/[^0-9]/g, '').slice(-10);

    // Delete from customer_addresses
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/customer_addresses?id=eq.${id}&customer_phone=eq.${cleanPhone}`, {
        method: 'DELETE',
        headers: supabaseHeaders
      });
    } catch (e) {}

    // Update global_settings list
    try {
      const getRes = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=eq.addresses_${cleanPhone}`, {
        headers: supabaseHeaders,
        cache: 'no-store'
      });
      if (getRes.ok) {
        const d = await getRes.json();
        if (Array.isArray(d) && d.length > 0) {
          let list = JSON.parse(d[0].value);
          if (Array.isArray(list)) {
            list = list.filter((a: any) => a.id !== id);
            await fetch(`${SUPABASE_URL}/rest/v1/global_settings`, {
              method: 'POST',
              headers: supabaseHeaders,
              body: JSON.stringify({
                key: `addresses_${cleanPhone}`,
                value: JSON.stringify(list)
              })
            });
          }
        }
      }
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'Address removed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
