import { Request, Response } from 'express';
import { MOCK_DB } from './cms.controller';

// In-Memory Database for Offers
// This bypasses Prisma since DATABASE_URL is missing.
export let MOCK_OFFERS: any[] = [
  {
    id: 'off_1',
    name: 'Diwali Mega Sale',
    discountType: 'percentage',
    discountValue: 15,
    scope: 'smart_rules',
    targetCategories: ['Eyeglasses', 'Eyevengers Special'],
    targetBrands: [],
    minPrice: null,
    maxPrice: null,
    targetIds: [],
    startDatetime: new Date(Date.now() - 86400000).toISOString(),
    endDatetime: new Date(Date.now() + 86400000 * 5).toISOString(),
    priority: 10,
    status: 'active',
    landingPageSlug: 'diwali-sale',
    requiresCoupon: true,
    couponCode: 'DIWALI50',
    redemptionCount: 45,
    totalRedemptionCap: 100,
    perCustomerLimit: 1,
    newCustomersOnly: false,
    minCartValue: 1500,
    stackingBehavior: 'best_price_wins'
  },
  {
    id: 'off_2',
    name: 'Brand Specific Deal',
    status: 'active',
    discountType: 'percentage',
    discountValue: 20,
    scope: 'smart_rules',
    targetCategories: [],
    targetBrands: ['Ray-Ban', 'Oakley'],
    minPrice: null,
    maxPrice: null,
    targetIds: [],
    startDatetime: new Date(Date.now() - 86400000).toISOString(),
    endDatetime: new Date(Date.now() + 86400000 * 30).toISOString(),
    priority: 5,
    landingPageSlug: '',
    requiresCoupon: false,
    couponCode: '',
    redemptionCount: 12,
    totalRedemptionCap: 50,
    perCustomerLimit: 2,
    newCustomersOnly: false,
    minCartValue: null,
    stackingBehavior: 'combine'
  }
];

export let MOCK_OFFER_REDEMPTIONS: any[] = [];

// GET all offers
export const getOffers = async (req: Request, res: Response) => {
  res.json(MOCK_OFFERS);
};

// GET single offer
export const getOfferById = async (req: Request, res: Response) => {
  const offer = MOCK_OFFERS.find(o => o.id === req.params.id);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  res.json(offer);
};

// POST new offer
export const createOffer = async (req: Request, res: Response) => {
  const newOffer = {
    id: `off_${Date.now()}`,
    ...req.body,
    redemptionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  MOCK_OFFERS.push(newOffer);
  res.status(201).json(newOffer);
};

// PUT update offer
export const updateOffer = async (req: Request, res: Response) => {
  const index = MOCK_OFFERS.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Offer not found' });
  
  MOCK_OFFERS[index] = {
    ...MOCK_OFFERS[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  if (req.body.targetCategories) MOCK_OFFERS[index].targetCategories = req.body.targetCategories;
  if (req.body.targetBrands) MOCK_OFFERS[index].targetBrands = req.body.targetBrands;
  if (req.body.minPrice !== undefined) MOCK_OFFERS[index].minPrice = req.body.minPrice;
  
  res.json(MOCK_OFFERS[index]);
};

// DELETE offer
export const deleteOffer = async (req: Request, res: Response) => {
  MOCK_OFFERS = MOCK_OFFERS.filter(o => o.id !== req.params.id);
  res.json({ success: true });
};

// POST Validate Coupon
export const validateCoupon = async (req: Request, res: Response) => {
  const { code, cartItems, user } = req.body;
  if (!code) return res.status(400).json({ valid: false, error: 'Coupon code is required' });

  const offer = MOCK_OFFERS.find(o => 
    o.requiresCoupon && 
    o.couponCode?.toUpperCase() === code.toUpperCase() && 
    o.status === 'active'
  );

  if (!offer) {
    return res.status(404).json({ valid: false, error: 'Invalid or inactive coupon code' });
  }

  // Check Dates
  const now = new Date();
  if (offer.startDatetime && new Date(offer.startDatetime) > now) {
    return res.status(400).json({ valid: false, error: 'Coupon is not active yet' });
  }
  if (offer.endDatetime && new Date(offer.endDatetime) < now) {
    return res.status(400).json({ valid: false, error: 'Coupon has expired' });
  }

  // Check Limits (Enhancement 2)
  if (offer.totalRedemptionCap !== null && offer.redemptionCount >= offer.totalRedemptionCap) {
    return res.status(400).json({ valid: false, error: 'This offer is no longer available (cap reached)' });
  }

  if (offer.minCartValue) {
    const cartTotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    if (cartTotal < offer.minCartValue) {
      return res.status(400).json({ 
        valid: false, 
        error: `Add ₹${offer.minCartValue - cartTotal} more to use this offer` 
      });
    }
  }

  if (offer.newCustomersOnly && user?.orderCount > 0) {
    return res.status(400).json({ valid: false, error: 'This offer is for new customers only' });
  }

  if (offer.perCustomerLimit !== null && user?.id) {
    const userRedemptions = MOCK_OFFER_REDEMPTIONS.filter(r => r.offerId === offer.id && r.userId === user.id).length;
    if (userRedemptions >= offer.perCustomerLimit) {
      return res.status(400).json({ valid: false, error: "You've already used this offer" });
    }
  }

  // Assume valid for cart items in this mock
  // A real app would check `offer.scope` against each item in `cartItems`
  res.json({ valid: true, offer });
};

// GET Calendar offers with overlap detection
export const getCalendarOffers = async (req: Request, res: Response) => {
  // Show all offers. If missing start/end, default to today -> next month so they appear
  const calendarOffers = MOCK_OFFERS.map(o => ({
    ...o,
    startDatetime: o.startDatetime || new Date().toISOString(),
    endDatetime: o.endDatetime || new Date(Date.now() + 86400000 * 30).toISOString()
  }));
  
  // Detect overlaps
  const offersWithConflicts = calendarOffers.map(offer => {
    let hasConflict = false;
    let conflictDetails = '';

    for (const other of calendarOffers) {
      if (offer.id === other.id) continue;

      // Check date overlap
      const offerStart = new Date(offer.startDatetime).getTime();
      const offerEnd = new Date(offer.endDatetime).getTime();
      const otherStart = new Date(other.startDatetime).getTime();
      const otherEnd = new Date(other.endDatetime).getTime();

      const overlapsDate = Math.max(offerStart, otherStart) < Math.min(offerEnd, otherEnd);

      if (overlapsDate) {
        // Check target intersection
        if (offer.scope === 'global' || other.scope === 'global') {
          hasConflict = true;
          conflictDetails = `Overlaps with Global offer: ${other.name}`;
          break;
        }

        const intersection = (offer.targetIds || []).filter((id: string) => (other.targetIds || []).includes(id));
        if (offer.scope === other.scope && intersection.length > 0) {
          hasConflict = true;
          conflictDetails = `Overlaps with ${other.name} on ${intersection.length} items`;
          break;
        }
      }
    }

    return {
      ...offer,
      hasConflict,
      conflictDetails
    };
  });

  res.json(offersWithConflicts);
};

// GET Offer Analytics (Enhancement 6)
export const getOfferAnalytics = async (req: Request, res: Response) => {
  const { id } = req.params;
  const offer = MOCK_OFFERS.find(o => o.id === id);
  
  if (!offer) {
    return res.status(404).json({ error: 'Offer not found' });
  }

  // Mock analytics data
  const impressions = Math.floor(Math.random() * 50000) + 10000;
  const clicks = Math.floor(impressions * (Math.random() * 0.15 + 0.05)); // 5-20% CTR
  
  const landingVisits = clicks + Math.floor(Math.random() * 5000);
  const addToCarts = Math.floor(landingVisits * 0.2); // 20% add to cart
  const checkouts = Math.floor(addToCarts * 0.4); // 40% of carts convert

  const revenue = checkouts * 1500; // avg order 1500
  const discountGiven = checkouts * (offer.discountType === 'percentage' ? 1500 * (offer.discountValue / 100) : offer.discountValue);

  res.json({
    funnel: {
      impressions,
      clicks,
      ctr: ((clicks / impressions) * 100).toFixed(1) + '%',
      landingVisits,
      addToCarts,
      checkouts,
      conversionRate: ((checkouts / landingVisits) * 100).toFixed(1) + '%'
    },
    financials: {
      revenue,
      discountGiven,
      netRevenue: revenue - discountGiven
    },
    topProducts: [
      { name: 'Midnight Blue Square Frame', unitsSold: Math.floor(checkouts * 0.3), revenue: Math.floor(checkouts * 0.3 * 1500) },
      { name: 'Tortoise Shell Round', unitsSold: Math.floor(checkouts * 0.2), revenue: Math.floor(checkouts * 0.2 * 1500) },
      { name: 'Crystal Clear Aviator', unitsSold: Math.floor(checkouts * 0.15), revenue: Math.floor(checkouts * 0.15 * 1500) }
    ]
  });
};

// GET Offer Usages across CMS (Enhancement 7)
export const getOfferUsages = async (req: Request, res: Response) => {
  const { id } = req.params;
  const usages: any[] = [];

  for (const section of MOCK_DB.sections) {
    const config = JSON.parse(section.configJson);
    
    // Top-level banner link
    if (config.linkedOfferId === id) {
      usages.push({
        sectionId: section.id,
        sectionType: section.sectionType,
        location: 'Top-level banner link'
      });
    }

    // Category Rail Tiles
    if (section.sectionType === 'CategoryRail' && Array.isArray(config.tiles)) {
      config.tiles.forEach((tile: any, index: number) => {
        if (tile.linkedOfferId === id) {
          usages.push({
            sectionId: section.id,
            sectionType: section.sectionType,
            location: `Tile index ${index} ("${tile.label}")`
          });
        }
      });
    }

    // Trending / Poster Slider Cards
    if (section.sectionType === 'PosterSlider' && Array.isArray(config.cards)) {
      config.cards.forEach((card: any, index: number) => {
        if (card.linkedOfferId === id) {
          usages.push({
            sectionId: section.id,
            sectionType: section.sectionType,
            location: `Card index ${index}`
          });
        }
      });
    }
  }

  res.json(usages);
};
