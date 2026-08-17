import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  productIds: string[];
  
  // Actions
  toggleItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],

      toggleItem: (productId) => {
        set((state) => {
          const exists = state.productIds.includes(productId);
          if (exists) {
            return { productIds: state.productIds.filter(id => id !== productId) };
          } else {
            return { productIds: [...state.productIds, productId] };
          }
        });
      },

      hasItem: (productId) => {
        return get().productIds.includes(productId);
      },

      clearWishlist: () => set({ productIds: [] })
    }),
    {
      name: 'eyevengers-wishlist',
    }
  )
);
