import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WishlistState {
  wishlistsByUser: Record<string, string[]>; // mapping of userId to their productIds. 'guest' for unauthenticated
  activeUserId: string;

  // Computed (getters) for the active user's wishlist
  productIds: string[];
  
  // Actions
  toggleItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  clearWishlist: () => void;
  switchUser: (userId: string | null) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlistsByUser: { 'guest': [] },
      activeUserId: 'guest',
      
      productIds: [],

      toggleItem: (productId) => {
        set((state) => {
          const uId = state.activeUserId;
          const userWishlist = state.wishlistsByUser[uId] || [];
          
          const exists = userWishlist.includes(productId);
          let newWishlist;
          
          if (exists) {
            newWishlist = userWishlist.filter(id => id !== productId);
          } else {
            newWishlist = [...userWishlist, productId];
          }

          return {
            wishlistsByUser: {
              ...state.wishlistsByUser,
              [uId]: newWishlist
            },
            productIds: newWishlist
          };
        });
      },

      hasItem: (productId) => {
        return get().productIds.includes(productId);
      },

      clearWishlist: () => {
        set((state) => {
          const uId = state.activeUserId;
          return {
            wishlistsByUser: {
              ...state.wishlistsByUser,
              [uId]: []
            },
            productIds: []
          };
        });
      },
      
      switchUser: (userId) => {
        set((state) => {
          const uId = userId || 'guest';
          const userWishlist = state.wishlistsByUser[uId] || [];
          
          return {
            activeUserId: uId,
            productIds: userWishlist
          };
        });
      }
    }),
    {
      name: 'eyevengers-multi-wishlist',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const uId = state.activeUserId;
          state.productIds = state.wishlistsByUser[uId] || [];
        }
      }
    }
  )
);
