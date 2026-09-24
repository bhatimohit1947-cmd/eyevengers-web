-- ==========================================================
-- EYEVENGERS: User Cart, Wishlist, and Address Tables
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bhjfsthxmzqumajquyvn/sql/new
-- ==========================================================

-- 1. Customer Addresses Table (ensure created with all needed columns)
CREATE TABLE IF NOT EXISTS customer_addresses (
  id TEXT PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  recipient_name TEXT NOT NULL DEFAULT 'Customer',
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  label TEXT DEFAULT 'Home',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Customer Carts Table
CREATE TABLE IF NOT EXISTS customer_carts (
  customer_phone TEXT PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_count INTEGER DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Customer Wishlists Table
CREATE TABLE IF NOT EXISTS customer_wishlists (
  customer_phone TEXT PRIMARY KEY,
  product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Grant Full Table Permissions
GRANT ALL ON TABLE customer_addresses TO anon, authenticated, service_role;
GRANT ALL ON TABLE customer_carts TO anon, authenticated, service_role;
GRANT ALL ON TABLE customer_wishlists TO anon, authenticated, service_role;

-- 5. Open RLS Policies for Anon & Authenticated
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all customer_addresses" ON customer_addresses;
CREATE POLICY "Allow public all customer_addresses" ON customer_addresses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE customer_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all customer_carts" ON customer_carts;
CREATE POLICY "Allow public all customer_carts" ON customer_carts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE customer_wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all customer_wishlists" ON customer_wishlists;
CREATE POLICY "Allow public all customer_wishlists" ON customer_wishlists FOR ALL USING (true) WITH CHECK (true);
