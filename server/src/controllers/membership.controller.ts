import { Request, Response } from 'express';
import { supabase } from '../supabaseClient';

export let MOCK_MEMBERSHIP_CUSTOMERS: any[] = [
  {
    id: 'cust_1',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    planId: 'gold_plan',
    tier: 'gold',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 700 * 86400000).toISOString(),
    status: 'active'
  },
  {
    id: 'cust_2',
    name: 'Priya Patel',
    email: 'priya@example.com',
    planId: 'silver_plan',
    tier: 'silver',
    startDate: new Date(Date.now() - 100 * 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 265 * 86400000).toISOString(),
    status: 'active'
  },
  {
    id: 'cust_3',
    name: 'Amit Kumar',
    email: 'amit@example.com',
    planId: 'bronze_plan',
    tier: 'bronze',
    startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 175 * 86400000).toISOString(),
    status: 'active'
  }
];

// Controller functions
export const getMembershipPlans = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('memberships').select('*');
    if (error) throw error;
    
    // Map snake_case to camelCase
    const formatted = data.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      durationMonths: p.validity_months,
      benefits: p.features || [],
      isActive: p.is_active,
      tier: p.badge_text || 'standard'
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch membership plans' });
  }
};

export const createMembershipPlan = async (req: Request, res: Response) => {
  const newPlan = {
    id: `plan_${Date.now()}`,
    name: req.body.name,
    price: req.body.price,
    validity_months: req.body.durationMonths,
    features: req.body.benefits,
    is_active: true,
    badge_text: req.body.tier
  };
  
  try {
    const { error } = await supabase.from('memberships').insert([newPlan]);
    if (error) throw error;
    res.status(201).json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create membership plan' });
  }
};

export const updateMembershipPlan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = {
    name: req.body.name,
    price: req.body.price,
    validity_months: req.body.durationMonths,
    features: req.body.benefits,
    is_active: req.body.isActive !== false,
    badge_text: req.body.tier
  };

  try {
    const { error } = await supabase.from('memberships').update(updates).eq('id', id);
    if (error) throw error;
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update membership plan' });
  }
};

export const getMembershipCustomers = async (req: Request, res: Response) => {
  res.json(MOCK_MEMBERSHIP_CUSTOMERS);
};
