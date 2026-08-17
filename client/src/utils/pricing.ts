export interface ProductPricing {
  mrp: number;
  sellingPrice: number; // Base selling price
  categoryId?: string;
  brandId?: string;
}

export interface UserContext {
  id?: string;
  tier?: 'GUEST' | 'GOLD';
  orderCount?: number;
}

export interface Offer {
  id: string;
  name: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  scope: 'global' | 'product' | 'category' | 'brand';
  targetIds: string[];
  status: 'active' | 'paused' | 'expired';
  startDatetime?: string;
  endDatetime?: string;
  // Enhancement 1: Coupons
  requiresCoupon?: boolean;
  couponCode?: string;
  // Enhancement 3: Stacking
  stackingBehavior?: 'best_price_wins' | 'stack_with_membership' | 'offer_overrides_membership' | 'not_applicable_to_members';
}

export interface PriceCalculationResult {
  originalPrice: number;
  discountedPrice: number;
  appliedOfferName?: string;
  appliedMembershipDiscount: boolean;
  reason: string;
}

// In a real app, this would be fetched from state/API. We'll export it so it can be populated.
export let ACTIVE_OFFERS: Offer[] = [];

export function getEffectivePrice(product: ProductPricing, user?: UserContext): PriceCalculationResult {
  // 1. Calculate Base Membership Price
  let membershipPrice = product.sellingPrice;
  let appliedMembershipDiscount = false;

  if (user?.tier === 'GOLD') {
    // Gold members get 10% off the base selling price
    membershipPrice = product.sellingPrice * 0.9;
    appliedMembershipDiscount = true;
  }

  // 2. Find best applicable Offer (ignoring coupons for automatic pricing)
  const now = new Date();
  let bestOfferPrice = product.sellingPrice;
  let bestOffer: Offer | null = null;

  const validOffers = ACTIVE_OFFERS.filter(offer => {
    if (offer.status !== 'active') return false;
    if (offer.requiresCoupon) return false; // Coupons are applied separately at checkout
    if (offer.startDatetime && new Date(offer.startDatetime) > now) return false;
    if (offer.endDatetime && new Date(offer.endDatetime) < now) return false;
    
    // Check scope
    if (offer.scope === 'global') return true;
    if (offer.scope === 'category' && product.categoryId && offer.targetIds.includes(product.categoryId)) return true;
    if (offer.scope === 'brand' && product.brandId && offer.targetIds.includes(product.brandId)) return true;
    if (offer.scope === 'product' && (product as any).id && offer.targetIds.includes((product as any).id)) return true;
    
    return false;
  });

  // Calculate the best offer price out of valid automatic offers
  for (const offer of validOffers) {
    let currentOfferPrice = product.sellingPrice;
    if (offer.discountType === 'percentage') {
      currentOfferPrice = product.sellingPrice * (1 - offer.discountValue / 100);
    } else if (offer.discountType === 'flat') {
      currentOfferPrice = Math.max(0, product.sellingPrice - offer.discountValue);
    }

    if (currentOfferPrice < bestOfferPrice) {
      bestOfferPrice = currentOfferPrice;
      bestOffer = offer;
    }
  }

  // 3. Apply Stacking Logic (Enhancement 3)
  let finalPrice = membershipPrice;
  let finalReason = appliedMembershipDiscount ? "Gold Member Discount applied" : "Standard Price";
  let finalOfferName: string | undefined = undefined;

  if (bestOffer) {
    const stacking = bestOffer.stackingBehavior || 'best_price_wins';
    
    switch (stacking) {
      case 'best_price_wins':
        if (bestOfferPrice < membershipPrice) {
          finalPrice = bestOfferPrice;
          finalReason = `Best available price applied (${bestOffer.name})`;
          finalOfferName = bestOffer.name;
          appliedMembershipDiscount = false;
        } else if (user?.tier === 'GOLD') {
          finalPrice = membershipPrice;
          finalReason = "Gold Membership gives a better price than current offers";
        }
        break;

      case 'stack_with_membership':
        if (user?.tier === 'GOLD') {
          // Apply offer on top of membership price
          if (bestOffer.discountType === 'percentage') {
            finalPrice = membershipPrice * (1 - bestOffer.discountValue / 100);
          } else {
            finalPrice = Math.max(0, membershipPrice - bestOffer.discountValue);
          }
          finalReason = `Stacked: Gold Discount + ${bestOffer.name}`;
          finalOfferName = bestOffer.name;
        } else {
          finalPrice = bestOfferPrice;
          finalReason = `${bestOffer.name} applied`;
          finalOfferName = bestOffer.name;
        }
        break;

      case 'offer_overrides_membership':
        finalPrice = bestOfferPrice;
        finalReason = `${bestOffer.name} overrides membership pricing`;
        finalOfferName = bestOffer.name;
        appliedMembershipDiscount = false;
        break;

      case 'not_applicable_to_members':
        if (user?.tier === 'GOLD') {
          finalPrice = membershipPrice;
          finalReason = `Offer ${bestOffer.name} is not applicable to Gold Members`;
          finalOfferName = undefined;
        } else {
          finalPrice = bestOfferPrice;
          finalReason = `${bestOffer.name} applied`;
          finalOfferName = bestOffer.name;
        }
        break;
    }
  }

  return {
    originalPrice: product.mrp,
    discountedPrice: finalPrice,
    appliedOfferName: finalOfferName,
    appliedMembershipDiscount,
    reason: finalReason
  };
}
