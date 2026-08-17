import { Request, Response } from 'express';

// Mock Databases
export let MOCK_MEMBERSHIP_PLANS: any[] = [
  {
    id: 'bronze_plan',
    name: 'Bronze Membership',
    tier: 'bronze',
    price: 999,
    durationMonths: 6,
    benefits: [
      'Flat 5% OFF on all orders',
      'Free standard shipping',
      'Priority customer support'
    ]
  },
  {
    id: 'silver_plan',
    name: 'Silver Membership',
    tier: 'silver',
    price: 1999,
    durationMonths: 12,
    benefits: [
      'Flat 10% OFF on all orders',
      'Free express shipping',
      'Early access to sales',
      '1 Free lens replacement per year'
    ]
  },
  {
    id: 'gold_plan',
    name: 'Gold Membership',
    tier: 'gold',
    price: 4999,
    durationMonths: 24,
    benefits: [
      'Flat 20% OFF on all orders',
      'Free express shipping globally',
      'VIP Event Invites',
      'Unlimited minor repairs',
      'Dedicated personal stylist'
    ]
  }
];

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
  res.json(MOCK_MEMBERSHIP_PLANS);
};

export const createMembershipPlan = async (req: Request, res: Response) => {
  const newPlan = {
    id: `plan_${Date.now()}`,
    ...req.body
  };
  MOCK_MEMBERSHIP_PLANS.push(newPlan);
  res.json(newPlan);
};

export const updateMembershipPlan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const index = MOCK_MEMBERSHIP_PLANS.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  MOCK_MEMBERSHIP_PLANS[index] = {
    ...MOCK_MEMBERSHIP_PLANS[index],
    ...req.body
  };

  res.json(MOCK_MEMBERSHIP_PLANS[index]);
};

export const getMembershipCustomers = async (req: Request, res: Response) => {
  res.json(MOCK_MEMBERSHIP_CUSTOMERS);
};
