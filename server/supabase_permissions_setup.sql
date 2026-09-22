-- ==========================================================
-- EYEVENGERS: Grant Full Web Access & Open Policies
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bhjfsthxmzqumajquyvn/sql/new
-- ==========================================================

-- 1. Grant full table permissions to anon & authenticated users
GRANT ALL ON TABLE customers TO anon, authenticated, service_role;
GRANT ALL ON TABLE user_memberships TO anon, authenticated, service_role;
GRANT ALL ON TABLE referral_vouchers TO anon, authenticated, service_role;
GRANT ALL ON TABLE customer_prescriptions TO anon, authenticated, service_role;
GRANT ALL ON TABLE customer_addresses TO anon, authenticated, service_role;
GRANT ALL ON TABLE coupons TO anon, authenticated, service_role;

-- 2. Open RLS Policies for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all customers" ON customers;
CREATE POLICY "Allow public all customers" ON customers FOR ALL USING (true) WITH CHECK (true);

-- 3. Open RLS Policies for user_memberships
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all user_memberships" ON user_memberships;
CREATE POLICY "Allow public all user_memberships" ON user_memberships FOR ALL USING (true) WITH CHECK (true);

-- 4. Open RLS Policies for referral_vouchers
ALTER TABLE referral_vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all referral_vouchers" ON referral_vouchers;
CREATE POLICY "Allow public all referral_vouchers" ON referral_vouchers FOR ALL USING (true) WITH CHECK (true);

-- 5. Open RLS Policies for customer_prescriptions
ALTER TABLE customer_prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all customer_prescriptions" ON customer_prescriptions;
CREATE POLICY "Allow public all customer_prescriptions" ON customer_prescriptions FOR ALL USING (true) WITH CHECK (true);

-- 6. Open RLS Policies for customer_addresses
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all customer_addresses" ON customer_addresses;
CREATE POLICY "Allow public all customer_addresses" ON customer_addresses FOR ALL USING (true) WITH CHECK (true);

-- 7. Open RLS Policies for coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all coupons" ON coupons;
CREATE POLICY "Allow public all coupons" ON coupons FOR ALL USING (true) WITH CHECK (true);

-- 8. Seed default coupons for the store
INSERT INTO coupons (id, code, discount_type, discount_value, min_order_value, max_discount, is_active)
VALUES 
  ('CPN-WELCOME', 'WELCOME10', 'PERCENTAGE', 10, 500, 300, true),
  ('CPN-FLAT500', 'FLAT500', 'FLAT', 500, 2000, 500, true)
ON CONFLICT (code) DO NOTHING;
