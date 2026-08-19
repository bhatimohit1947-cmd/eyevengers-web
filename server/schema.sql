-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  brand TEXT,
  gender TEXT,
  price NUMERIC NOT NULL,
  stock INTEGER NOT NULL,
  image_url TEXT,
  status TEXT
);

-- Offers Table
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  banner_url TEXT
);

-- Memberships Table
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  validity_months INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  badge_text TEXT
);

-- Global Settings Table
CREATE TABLE IF NOT EXISTS global_settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Eye Test Settings
CREATE TABLE IF NOT EXISTS eye_test_settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Eye Test Bookings
CREATE TABLE IF NOT EXISTS eye_test_bookings (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lens Categories
CREATE TABLE IF NOT EXISTS lens_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  has_power_input BOOLEAN,
  power_fields JSONB,
  normal_limit NUMERIC,
  high_power_surcharge NUMERIC
);

-- Lens Products
CREATE TABLE IF NOT EXISTS lens_products (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES lens_categories(id),
  name TEXT NOT NULL,
  features JSONB,
  base_price NUMERIC
);

-- Default data for global_settings
INSERT INTO global_settings (key, value) VALUES 
('storeName', '"Eyevengers Official Store"'),
('supportEmail', '"support@eyevengers.com"'),
('taxRate', '18'),
('currency', '"INR"')
ON CONFLICT (key) DO NOTHING;

-- Default data for eye_test_settings
INSERT INTO eye_test_settings (key, value) VALUES 
('store', '{"isAvailable": true, "title": "At Store Eye Test", "description": "Visit our nearest store for a free 12-step eye examination using advanced automated equipment.", "features": ["12-Step Checkup", "Expert Optometrists", "Free of Cost"], "price": 0}'),
('home', '{"isAvailable": true, "title": "Home Eye Test", "description": "Can''t visit? We''ll bring the clinic to you. Get your eyes tested at home with portable advanced tech.", "features": ["Certified Professional Visit", "Try 100+ Frames at Home", "Just ₹199 (Refundable)"], "price": 199}')
ON CONFLICT (key) DO NOTHING;

-- Default data for lens_categories
INSERT INTO lens_categories (id, name, has_power_input, power_fields, normal_limit, high_power_surcharge) VALUES
('zero', 'Zero Power', false, '[]', 0, 0),
('single', 'Single Vision', true, '["SPH", "CYL", "AXIS"]', 2.50, 500),
('bifocal', 'Bifocal', true, '["SPH", "CYL", "AXIS", "ADD", "PD"]', 2.00, 800),
('progressive', 'Progressive', true, '["SPH", "CYL", "AXIS", "ADD", "PD"]', 2.00, 1000)
ON CONFLICT (id) DO NOTHING;

-- Default data for lens_products
INSERT INTO lens_products (id, category_id, name, features, base_price) VALUES
('L-1', 'zero', 'Zero Power Blue Cut', '["Blocks 98% blue light"]', 0),
('L-2', 'single', 'Premium Single Vision', '["Anti-Glare", "Scratch Resistant"]', 500),
('L-3', 'bifocal', 'Standard Bifocal', '["Clear distance & near"]', 1200),
('L-4', 'progressive', 'HD Progressive', '["Seamless multifocal", "Blue cut"]', 2500)
ON CONFLICT (id) DO NOTHING;
