"use client";

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';

export function SyncActivity() {
  const { user, isLoggedIn } = useAuthStore();
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

  return null;
}
