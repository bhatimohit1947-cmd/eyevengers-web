"use client";

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';

export function SyncActivity() {
  const { user, isLoggedIn, membershipTier, membershipBenefits, setMembershipTier } = useAuthStore();
  const cartCount = useCartStore(state => state.totalCount);
  const { productIds } = useWishlistStore();
  const wishlistCount = productIds.length;

  const previousCounts = useRef({ cartCount: -1, wishlistCount: -1 });

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    
    // Check if anything actually changed to prevent spamming the API
    if (cartCount === previousCounts.current.cartCount && wishlistCount === previousCounts.current.wishlistCount) {
      return;
    }

    previousCounts.current = { cartCount, wishlistCount };

    // Update local storage fallback for immediate Admin panel reflection
    try {
      const localCustomers = JSON.parse(localStorage.getItem('eyevengers_mock_customers') || '[]');
      const customerIndex = localCustomers.findIndex((c: any) => c.id === user.id);
      if (customerIndex >= 0) {
        localCustomers[customerIndex].cartCount = cartCount;
        localCustomers[customerIndex].wishlistCount = wishlistCount;
        localStorage.setItem('eyevengers_mock_customers', JSON.stringify(localCustomers));
      }
    } catch (e) {
      console.error("Failed to update local storage stats", e);
    }

    fetch('/api/customers/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        cartCount,
        wishlistCount
      })
    }).catch(console.error);
  }, [user, isLoggedIn, cartCount, wishlistCount]);

  // Sync membership benefits on load in case they were updated in admin but local storage is stale
  useEffect(() => {
    if (isLoggedIn && membershipTier && membershipTier !== 'none') {
      fetch('https://eyevengers-web.onrender.com/api/memberships/plans')
        .then(res => res.json())
        .then(data => {
          const plan = data.find((p: any) => p.tier === membershipTier.toLowerCase());
          if (plan) {
            let parsedBenefits = plan.benefitsJson;
            if (!parsedBenefits && plan.benefits) {
              for (const b of plan.benefits) {
                if (typeof b === 'string' && b.startsWith('__BENEFITS_JSON__:')) {
                  try { parsedBenefits = JSON.parse(b.replace('__BENEFITS_JSON__:', '')); } catch(e){}
                }
              }
            }
            
            // If benefits changed or were missing, update store
            if (JSON.stringify(membershipBenefits) !== JSON.stringify(parsedBenefits)) {
              setMembershipTier(membershipTier, parsedBenefits);
            }
          }
        })
        .catch(console.error);
    }
  }, [isLoggedIn, membershipTier]);

  return null;
}
