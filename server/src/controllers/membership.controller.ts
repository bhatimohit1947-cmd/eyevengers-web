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
    
    // Map snake_case to camelCase and extract benefitsJson
    const formatted = data.map(p => {
      let benefitsJson = {};
      const displayFeatures = [];
      const featuresArr = p.features || [];
      
      for (const feature of featuresArr) {
        if (typeof feature === 'string' && feature.startsWith('__BENEFITS_JSON__:')) {
          try {
            benefitsJson = JSON.parse(feature.replace('__BENEFITS_JSON__:', ''));
          } catch (e) {}
        } else {
          displayFeatures.push(feature);
        }
      }

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        durationMonths: p.validity_months,
        benefits: displayFeatures,
        benefitsJson,
        isActive: p.is_active,
        tier: p.badge_text || 'standard'
      };
    });
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch membership plans' });
  }
};

export const createMembershipPlan = async (req: Request, res: Response) => {
  const features = req.body.benefits || [];
  if (req.body.benefitsJson) {
    features.push(`__BENEFITS_JSON__:${JSON.stringify(req.body.benefitsJson)}`);
  }

  const newPlan = {
    id: `plan_${Date.now()}`,
    name: req.body.name,
    price: req.body.price,
    validity_months: req.body.durationMonths,
    features: features,
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
  const features = req.body.benefits || [];
  if (req.body.benefitsJson) {
    features.push(`__BENEFITS_JSON__:${JSON.stringify(req.body.benefitsJson)}`);
  }

  const updates = {
    name: req.body.name,
    price: req.body.price,
    validity_months: req.body.durationMonths,
    features: features,
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
  try {
    const { data: settingsData, error } = await supabase.from('global_settings').select('*');
    if (error) throw error;
    
    const memberships: any[] = [];
    const usersMap: Record<string, any> = {};

    if (settingsData) {
      settingsData.forEach(row => {
        if (row.key.startsWith('membership_')) {
          try {
            memberships.push(JSON.parse(row.value));
          } catch(e) {}
        } else if (row.key.startsWith('user_')) {
          try {
            const user = JSON.parse(row.value);
            usersMap[user.id] = user;
          } catch(e) {}
        }
      });
    }

    const { data: plansData } = await supabase.from('memberships').select('id, name');
    const plansMap: Record<string, string> = {};
    if (plansData) {
      plansData.forEach(p => plansMap[p.id] = p.name);
    }

    const formattedCustomers = memberships.map((m: any) => {
      const user = usersMap[m.user_id] || {};
      return {
        id: m.user_id,
        name: user.name || 'Unknown User',
        email: user.email || 'N/A',
        phone: user.phone || 'N/A',
        planId: m.plan_id,
        planName: plansMap[m.plan_id] || m.plan_id,
        tier: m.tier,
        startDate: m.start_date,
        expiryDate: m.expiry_date,
        status: m.status
      };
    });

    res.json(formattedCustomers);
  } catch (err) {
    console.error('Failed to fetch membership customers:', err);
    res.status(500).json({ error: 'Failed to fetch membership customers' });
  }
};

export const updateMembershipCustomerStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const key = `membership_${id}`;
    
    // First fetch existing
    const { data, error } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', key)
      .single();
      
    if (error || !data) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    
    const membership = JSON.parse(data.value);
    membership.status = status;
    
    const { error: updateError } = await supabase
      .from('global_settings')
      .upsert({ key, value: JSON.stringify(membership) });
      
    if (updateError) throw updateError;
    
    res.json({ success: true, status });
  } catch (err) {
    console.error('Failed to update membership status:', err);
    res.status(500).json({ error: 'Failed to update membership status' });
  }
};
