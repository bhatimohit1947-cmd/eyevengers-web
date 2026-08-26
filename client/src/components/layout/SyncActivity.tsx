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
