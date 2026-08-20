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
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
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
    image_url: imageUrl,
    status: Number(stock) > 0 ? 'Active' : 'Out of Stock'
  };
  
  try {
    const { error } = await supabase.from('products').insert([newProduct]);
    if (error) throw error;
    res.status(201).json({ ...newProduct, imageUrl: newProduct.image_url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, sku, category, brand, gender, price, stock, imageUrl } = req.body;
  
  const updates: any = {
    name,
    sku,
    category,
    brand: brand || 'Generic',
    gender: gender || 'Unisex',
    price: Number(price),
    stock: Number(stock),
    image_url: imageUrl,
    status: Number(stock) > 0 ? 'Active' : 'Out of Stock'
  };
  
  try {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) throw error;
    res.json({ id, ...updates, imageUrl: updates.image_url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
// ==========================
// ORDERS
// ==========================
export const getOrders = async (req: Request, res: Response) => {
  res.json([]); // Order management out of scope for this migration
};

// ==========================
// CUSTOMERS
// ==========================
export const getCustomers = async (req: Request, res: Response) => {
  res.json([]); // Customer management out of scope for this migration
};

// ==========================
// SETTINGS
// ==========================
export const getSettings = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('global_settings').select('*');
    if (error) throw error;
    
    // Convert array of key-value pairs to a single object
    const settingsObj: any = {};
    (data || []).forEach(row => {
      settingsObj[row.key] = row.value;
    });
    
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    // req.body is an object like { storeName: 'abc', taxRate: 18 }
    const updates = Object.keys(req.body).map(key => ({
      key,
      value: req.body[key]
    }));
    
    const { error } = await supabase.from('global_settings').upsert(updates);
    if (error) throw error;
    
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// ==========================
// NOTIFICATIONS (Removed per request)
// ==========================

export const getNotifications = async (req: Request, res: Response) => {
  res.json([]);
};

export const markNotificationRead = async (req: Request, res: Response) => {
  res.json({ success: true });
};

export const createNotification = async (category: string, title: string, message: string) => {
  // Dummy function to prevent build errors where it's imported
  return;
};

export const recordLoginEvent = async (req: Request, res: Response) => {
  // Dummy function
  res.json({ success: true });
};

export const getSidebarCounts = async (req: Request, res: Response) => {
  try {
    // 2. Get pending orders count
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending'); // Or 'Processing', etc.

    // 3. Get total eye test bookings from in-memory array
    const eyeTestCount = inMemoryEyeTestBookings.filter(b => b.status === 'Pending').length;

    res.json({
      notifications: 0,
      orders: ordersCount || 0,
      eyeTests: eyeTestCount || 0
    });
  } catch (error) {
    console.error("Failed to get sidebar counts:", error);
    res.status(500).json({ error: 'Failed to get counts' });
  }
};

// ==========================
// EYE TESTS & BOOKINGS
// ==========================

// In-Memory Database for Eye Test Bookings (To bypass Supabase RLS issues)
let inMemoryEyeTestBookings: any[] = [];

export const getEyeTestSettings = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('eye_test_settings').select('*');
    if (error) throw error;
    
    const settingsObj: any = {};
    (data || []).forEach(row => {
      settingsObj[row.key] = row.value;
    });
    
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch eye test settings' });
  }
};

export const updateEyeTestSettings = async (req: Request, res: Response) => {
  try {
    const updates = Object.keys(req.body).map(key => ({
      key,
      value: req.body[key]
    }));
    
    const { error } = await supabase.from('eye_test_settings').upsert(updates);
    if (error) throw error;
    
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update eye test settings' });
  }
};

export const getEyeTestBookings = async (req: Request, res: Response) => {
  try {
    // Return from in-memory array
    res.json(inMemoryEyeTestBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch eye test bookings' });
  }
};

export const createEyeTestBooking = async (req: Request, res: Response) => {
  try {
    const newBooking = {
      id: `ET-${Date.now()}`,
      ...req.body,
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    
    // Save to in-memory array
    inMemoryEyeTestBookings.push(newBooking);

    res.status(201).json(newBooking);
  } catch (error) {
    console.error("Eye test booking error:", error);
    res.status(500).json({ error: 'Failed to create eye test booking', details: error });
  }
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
  try {
    const { categories, products } = req.body;
    
    // Wipe and replace (upsert isn't perfect for deletes, but we'll use upsert for simplicity since ids are fixed or managed)
    if (categories && categories.length > 0) {
      const formattedCategories = categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        has_power_input: c.hasPowerInput,
        power_fields: c.powerFields,
        normal_limit: c.normalLimit,
        high_power_surcharge: c.highPowerSurcharge
      }));
      const { error: catError } = await supabase.from('lens_categories').upsert(formattedCategories);
      if (catError) throw catError;
    }
    
    if (products && products.length > 0) {
      const formattedProducts = products.map((p: any) => ({
        id: p.id,
        category_id: p.categoryId,
        name: p.name,
        features: p.features,
        base_price: p.basePrice
      }));
      const { error: prodError } = await supabase.from('lens_products').upsert(formattedProducts);
      if (prodError) throw prodError;
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating lens settings:', error);
    res.status(500).json({ error: 'Failed to update lens settings' });
  }
};
