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
  switchUser: (userId: string | null, userPhone?: string) => void;
  syncWithServer: (phone?: string) => Promise<void>;
}

// Background helper to persist wishlist to cloud
const persistWishlistToCloud = async (phone: string | undefined, productIds: string[]) => {
  if (!phone) {
    try {
      const auth = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('eyevengers-auth-storage') || '{}') : null;
      phone = auth?.state?.user?.phone;
    } catch(e) {}
  }
  if (!phone) return;
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  if (!cleanPhone) return;

  try {
    fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, productIds })
    }).catch(() => {});
  } catch(e) {}
};

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
          let newWishlist: string[];
          
          if (exists) {
            newWishlist = userWishlist.filter(id => id !== productId);
          } else {
            newWishlist = [...userWishlist, productId];
          }

          if (uId !== 'guest') {
            persistWishlistToCloud(uId, newWishlist);
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
        const uId = get().activeUserId;
        if (uId !== 'guest') {
          persistWishlistToCloud(uId, []);
        }

        set((state) => {
          return {
            wishlistsByUser: {
              ...state.wishlistsByUser,
              [uId]: []
            },
            productIds: []
          };
        });
      },
      
      switchUser: (userId, userPhone) => {
        set((state) => {
          const uId = userId || 'guest';
          const userWishlist = state.wishlistsByUser[uId] || [];
          
          return {
            activeUserId: uId,
            productIds: userWishlist
          };
        });

        if (userId && userId !== 'guest') {
          get().syncWithServer(userPhone || userId);
        }
      },

      syncWithServer: async (phone) => {
        let targetPhone = phone;
        if (!targetPhone) {
          try {
            const auth = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('eyevengers-auth-storage') || '{}') : null;
            targetPhone = auth?.state?.user?.phone;
          } catch(e) {}
        }
        if (!targetPhone) return;

        const cleanPhone = targetPhone.replace(/[^0-9]/g, '').slice(-10);
        if (!cleanPhone) return;

        try {
          const res = await fetch(`/api/wishlist?phone=${cleanPhone}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.productIds)) {
              const serverList: string[] = data.productIds;
              const currentState = get();
              const activeId = currentState.activeUserId;

              // Merge local items with server items (deduplicating)
              const combined = Array.from(new Set([...serverList, ...currentState.productIds]));

              set((state) => ({
                wishlistsByUser: {
                  ...state.wishlistsByUser,
                  [activeId]: combined
                },
                productIds: combined
              }));

              if (combined.length !== serverList.length) {
                persistWishlistToCloud(cleanPhone, combined);
              }
            }
          }
        } catch(e) {
          console.warn('Wishlist server sync warning:', e);
        }
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
