-- ==========================================================
-- EYEVENGERS: Create dedicated 'customers' table in Supabase
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/bhjfsthxmzqumajquyvn/sql/new
-- ==========================================================

-- 1. Create the customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Valued Customer',
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  pin TEXT DEFAULT '0000',
  membership_tier TEXT DEFAULT 'none',
  cart_count INTEGER DEFAULT 0,
  wishlist_count INTEGER DEFAULT 0,
  referral_code TEXT,
  referred_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Disable Row Level Security (RLS) so the website can read/write without permissions issues
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;

-- 3. Create index on phone number for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 4. Automatically migrate existing customers into the new customers table
INSERT INTO customers (id, name, phone, email, pin, membership_tier, created_at, updated_at)
VALUES 
  ('CUST-8619306495', 'Mohit bhati', '8619306495', 'bhatimohit1947@gmail.com', '1234', 'none', NOW(), NOW()),
  ('CUST-7240158860', 'Pradeep', '7240158860', 'pradeep@example.com', '0000', 'none', NOW(), NOW()),
  ('CUST-7851923500', 'priyansh rai', '7851923500', 'priyanshrai84@gmail.com', '0000', 'none', NOW(), NOW()),
  ('CUST-8955499282', 'harshita', '8955499282', 'N/A', '0000', 'none', NOW(), NOW()),
  ('CUST-9876500000', 'Direct Supabase User', '9876500000', 'direct@eyevengers.com', '0000', 'none', NOW(), NOW()),
  ('CUST-9999988888', 'Test User', '9999988888', 'test@eyevengers.com', '0000', 'none', NOW(), NOW())
ON CONFLICT (phone) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = NOW();
