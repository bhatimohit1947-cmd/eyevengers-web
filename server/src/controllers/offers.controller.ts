import { Request, Response } from 'express';
import { supabase } from '../supabaseClient';
import { MOCK_DB } from './cms.controller';

export let MOCK_OFFER_REDEMPTIONS: any[] = [];

// GET all offers
export const getOffers = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('offers').select('*').order('start_date', { ascending: false });
    if (error) throw error;
    
    // Map snake_case to camelCase
    const formatted = data.map(o => ({
      ...o,
      discountType: o.discount_type,
      discountValue: o.discount_value,
      startDatetime: o.start_date,
      endDatetime: o.end_date,
      isActive: o.is_active,
      bannerUrl: o.banner_url
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
};

// GET single offer
export const getOfferById = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('offers').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json({
      ...data,
      discountType: data.discount_type,
      discountValue: data.discount_value,
      startDatetime: data.start_date,
      endDatetime: data.end_date,
      isActive: data.is_active,
      bannerUrl: data.banner_url
    });
  } catch (error) {
    res.status(404).json({ error: 'Offer not found' });
  }
};

// POST new offer
export const createOffer = async (req: Request, res: Response) => {
  const newOffer = {
    id: `off_${Date.now()}`,
    name: req.body.name,
    description: req.body.description,
    discount_type: req.body.discountType,
    discount_value: req.body.discountValue,
    start_date: req.body.startDatetime,
    end_date: req.body.endDatetime,
    is_active: req.body.isActive !== false,
    banner_url: req.body.bannerUrl
  };
  try {
    const { error } = await supabase.from('offers').insert([newOffer]);
    if (error) throw error;
    res.status(201).json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create offer' });
  }
};

// PUT update offer
export const updateOffer = async (req: Request, res: Response) => {
  const updates = {
    name: req.body.name,
    description: req.body.description,
    discount_type: req.body.discountType,
    discount_value: req.body.discountValue,
    start_date: req.body.startDatetime,
    end_date: req.body.endDatetime,
    is_active: req.body.isActive !== false,
    banner_url: req.body.bannerUrl
  };
  try {
    const { error } = await supabase.from('offers').update(updates).eq('id', req.params.id);
    if (error) throw error;
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update offer' });
  }
};

// DELETE offer
export const deleteOffer = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('offers').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete offer' });
  }
};

// POST Validate Coupon (Stub for Supabase migration)
export const validateCoupon = async (req: Request, res: Response) => {
  res.json({ valid: false, error: 'Coupon validation is under maintenance' });
};

// GET Calendar offers with overlap detection
export const getCalendarOffers = async (req: Request, res: Response) => {
  try {
    const { data } = await supabase.from('offers').select('*');
    const formatted = (data || []).map(o => ({
      ...o,
      startDatetime: o.start_date || new Date().toISOString(),
      endDatetime: o.end_date || new Date(Date.now() + 86400000 * 30).toISOString()
    }));
    res.json(formatted);
  } catch (error) {
    res.json([]);
  }
};

// GET Offer Analytics (Enhancement 6)
export const getOfferAnalytics = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data: offer } = await supabase.from('offers').select('*').eq('id', id).single();
  
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
