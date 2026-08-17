import { Request, Response } from 'express';
import { supabase } from '../supabaseClient';

// In-Memory Database for Admin Entities
let MOCK_DB = {
  products: [
    { id: '1', name: 'Midnight Blue Square Frame', sku: 'E-10023', category: 'Eyeglasses', brand: 'Ray-Ban', gender: 'Men', stock: 45, price: 1500, status: 'Active' },
    { id: '2', name: 'Golden Aviator Pro', sku: 'S-20991', category: 'Sunglasses', brand: 'Oakley', gender: 'Unisex', stock: 12, price: 2500, status: 'Active' },
    { id: '3', name: 'Crystal Clear Rimless', sku: 'E-10044', category: 'Eyeglasses', brand: 'Lenskart', gender: 'Women', stock: 0, price: 3200, status: 'Out of Stock' },
    { id: '4', name: 'Kids Flexible Pink', sku: 'K-30012', category: 'Kids', brand: 'Generic', gender: 'Kids', stock: 120, price: 999, status: 'Active' },
    { id: '5', name: 'Iron Man Edition', sku: 'E-10099', category: 'Eyevengers Special', brand: 'Eyevengers', gender: 'Unisex', stock: 50, price: 4999, status: 'Active' }
  ],
  orders: [
    { id: 'ORD-7291', customerName: 'Rahul Sharma', date: new Date(Date.now() - 86400000).toISOString(), status: 'Delivered', total: 4500 },
    { id: 'ORD-7292', customerName: 'Priya Verma', date: new Date(Date.now() - 40000000).toISOString(), status: 'Processing', total: 2500 },
    { id: 'ORD-7293', customerName: 'Amit Kumar', date: new Date(Date.now() - 20000000).toISOString(), status: 'Shipped', total: 1500 },
    { id: 'ORD-7294', customerName: 'Neha Gupta', date: new Date().toISOString(), status: 'Pending', total: 3200 }
  ],
  customers: [
    { id: 'C-001', name: 'Rahul Sharma', phone: '+91 9876543210', email: 'rahul.s@example.com', joinedAt: new Date(Date.now() - 10000000000).toISOString() },
    { id: 'C-002', name: 'Priya Verma', phone: '+91 9876543211', email: 'priya.v@example.com', joinedAt: new Date(Date.now() - 5000000000).toISOString() },
    { id: 'C-003', name: 'Amit Kumar', phone: '+91 9876543212', email: 'amit.k@example.com', joinedAt: new Date(Date.now() - 2000000000).toISOString() }
  ],
  settings: {
    storeName: 'Eyevengers Official Store',
    supportEmail: 'support@eyevengers.com',
    taxRate: 18,
    currency: 'INR'
  },
  eyeTestSettings: {
    store: {
      isAvailable: true,
      title: "At Store Eye Test",
      description: "Visit our nearest store for a free 12-step eye examination using advanced automated equipment.",
      features: ["12-Step Checkup", "Expert Optometrists", "Free of Cost"],
      price: 0
    },
    home: {
      isAvailable: true,
      title: "Home Eye Test",
      description: "Can't visit? We'll bring the clinic to you. Get your eyes tested at home with portable advanced tech.",
      features: ["Certified Professional Visit", "Try 100+ Frames at Home", "Just ₹199 (Refundable)"],
      price: 199
    }
  },
  eyeTestBookings: [] as any[],
  stores: [
    {
      id: 'S-1',
      name: 'Eyevengers Main, Jodhpur',
      address: '123 Main Street, Jodhpur, Rajasthan 342001',
      mapLink: 'https://maps.google.com/?q=Jodhpur',
      phone: '+91 9876543210'
    },
    {
      id: 'S-2',
      name: 'Eyevengers Mall, Jaipur',
      address: 'Shop 45, GT Mall, Jaipur, Rajasthan 302017',
      mapLink: 'https://maps.google.com/?q=Jaipur',
      phone: '+91 9876543211'
    }
  ] as any[],
  lensSettings: {
    categories: [
      { id: 'zero', name: 'Zero Power', hasPowerInput: false, powerFields: [], normalLimit: 0, highPowerSurcharge: 0 },
      { id: 'single', name: 'Single Vision', hasPowerInput: true, powerFields: ['SPH', 'CYL', 'AXIS'], normalLimit: 2.50, highPowerSurcharge: 500 },
      { id: 'bifocal', name: 'Bifocal', hasPowerInput: true, powerFields: ['SPH', 'CYL', 'AXIS', 'ADD', 'PD'], normalLimit: 2.00, highPowerSurcharge: 800 },
      { id: 'progressive', name: 'Progressive', hasPowerInput: true, powerFields: ['SPH', 'CYL', 'AXIS', 'ADD', 'PD'], normalLimit: 2.00, highPowerSurcharge: 1000 }
    ],
    products: [
      { id: 'L-1', categoryId: 'zero', name: 'Zero Power Blue Cut', features: ['Blocks 98% blue light'], basePrice: 0 },
      { id: 'L-2', categoryId: 'single', name: 'Premium Single Vision', features: ['Anti-Glare', 'Scratch Resistant'], basePrice: 500 },
      { id: 'L-3', categoryId: 'bifocal', name: 'Standard Bifocal', features: ['Clear distance & near'], basePrice: 1200 },
      { id: 'L-4', categoryId: 'progressive', name: 'HD Progressive', features: ['Seamless multifocal', 'Blue cut'], basePrice: 2500 }
    ]
  }
};

// ==========================
// PRODUCTS
// ==========================
export const getProducts = async (req: Request, res: Response) => {
  res.json(MOCK_DB.products);
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, sku, category, brand, gender, price, stock, imageUrl } = req.body;
  const newProduct = {
    id: `P-${Date.now()}`,
    name,
    sku,
    category,
    brand: brand || 'Generic',
    gender: gender || 'Unisex',
    price: Number(price),
    stock: Number(stock),
    imageUrl,
    status: Number(stock) > 0 ? 'Active' : 'Out of Stock'
  };
  MOCK_DB.products.push(newProduct);
  res.status(201).json(newProduct);
};

// ==========================
// ORDERS
// ==========================
export const getOrders = async (req: Request, res: Response) => {
  res.json(MOCK_DB.orders);
};

// ==========================
// CUSTOMERS
// ==========================
export const getCustomers = async (req: Request, res: Response) => {
  res.json(MOCK_DB.customers);
};

// ==========================
// SETTINGS
// ==========================
export const getSettings = async (req: Request, res: Response) => {
  res.json(MOCK_DB.settings);
};

export const updateSettings = async (req: Request, res: Response) => {
  MOCK_DB.settings = { ...MOCK_DB.settings, ...req.body };
  res.json(MOCK_DB.settings);
};

// ==========================
// EYE TESTS & BOOKINGS
// ==========================
export const getEyeTestSettings = async (req: Request, res: Response) => {
  res.json(MOCK_DB.eyeTestSettings);
};

export const updateEyeTestSettings = async (req: Request, res: Response) => {
  MOCK_DB.eyeTestSettings = { ...MOCK_DB.eyeTestSettings, ...req.body };
  res.json(MOCK_DB.eyeTestSettings);
};

export const getEyeTestBookings = async (req: Request, res: Response) => {
  res.json(MOCK_DB.eyeTestBookings);
};

export const createEyeTestBooking = async (req: Request, res: Response) => {
  const newBooking = {
    id: `ETB-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...req.body,
    status: 'Confirmed'
  };
  MOCK_DB.eyeTestBookings.unshift(newBooking);
  res.status(201).json(newBooking);
};

// ==========================
// STORES
// ==========================
export const getStores = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('stores').select('*');
    if (error) throw error;
    
    // Map snake_case to camelCase
    const formattedStores = (data || []).map(store => ({
      ...store,
      mapLink: store.map_link
    }));
    
    res.json(formattedStores);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
};

export const createStore = async (req: Request, res: Response) => {
  try {
    const newStore = {
      id: `S-${Date.now()}`,
      name: req.body.name,
      address: req.body.address,
      map_link: req.body.mapLink,
      phone: req.body.phone
    };
    
    const { error } = await supabase.from('stores').insert([newStore]);
    if (error) throw error;
    
    res.status(201).json({ ...newStore, mapLink: newStore.map_link });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create store' });
  }
};

export const deleteStore = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('stores').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete store' });
  }
};

// ==========================
// LENS SETTINGS (Categories & Products)
// ==========================
export const getLensSettings = async (req: Request, res: Response) => {
  try {
    const [categoriesRes, productsRes] = await Promise.all([
      supabase.from('lens_categories').select('*'),
      supabase.from('lens_products').select('*')
    ]);
    
    if (categoriesRes.error) throw categoriesRes.error;
    if (productsRes.error) throw productsRes.error;
    
    const categories = (categoriesRes.data || []).map(c => ({
      id: c.id,
      name: c.name,
      hasPowerInput: c.has_power_input,
      powerFields: c.power_fields,
      normalLimit: c.normal_limit,
      highPowerSurcharge: c.high_power_surcharge
    }));
    
    const products = (productsRes.data || []).map(p => ({
      id: p.id,
      categoryId: p.category_id,
      name: p.name,
      features: p.features,
      basePrice: p.base_price
    }));
    
    res.json({ categories, products });
  } catch (error) {
    console.error('Error fetching lens settings:', error);
    res.status(500).json({ error: 'Failed to fetch lens settings' });
  }
};

export const updateLensSettings = async (req: Request, res: Response) => {
  MOCK_DB.lensSettings = { ...MOCK_DB.lensSettings, ...req.body };
  res.json(MOCK_DB.lensSettings);
};
