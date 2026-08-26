import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  lensConfig?: any;
  qty: number;
  price: number;
  title: string;
  imageUrl?: string;
}

interface UserCart {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
}

interface CartState {
  cartsByUser: Record<string, UserCart>; // mapping of userId to their cart. 'guest' for unauthenticated
  activeUserId: string;
  
  // Computed (getters) for the active user's cart
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  switchUser: (userId: string | null) => void;
}

const getEmptyCart = (): UserCart => ({
  items: [],
  totalCount: 0,
  totalPrice: 0,
});

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartsByUser: { 'guest': getEmptyCart() },
      activeUserId: 'guest',
      
      items: [],
      totalCount: 0,
      totalPrice: 0,

      addItem: (newItem) => {
        set((state) => {
          const uId = state.activeUserId;
          const userCart = state.cartsByUser[uId] || getEmptyCart();
          
          const existingItemIndex = userCart.items.findIndex(
            (item) => item.productId === newItem.productId && 
                      item.variantId === newItem.variantId &&
                      JSON.stringify(item.lensConfig) === JSON.stringify(newItem.lensConfig)
          );

          let newItems = [...userCart.items];
          if (existingItemIndex >= 0) {
            newItems[existingItemIndex].qty += newItem.qty;
          } else {
            newItems.push(newItem);
          }

          const newTotalCount = newItems.reduce((acc, item) => acc + item.qty, 0);
          const newTotalPrice = newItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

          return {
            cartsByUser: {
              ...state.cartsByUser,
              [uId]: { items: newItems, totalCount: newTotalCount, totalPrice: newTotalPrice }
            },
            items: newItems,
            totalCount: newTotalCount,
            totalPrice: newTotalPrice
          };
        });
      },

      removeItem: (itemId) => {
        set((state) => {
          const uId = state.activeUserId;
          const userCart = state.cartsByUser[uId] || getEmptyCart();
          
          const newItems = userCart.items.filter((item) => item.id !== itemId);
          const newTotalCount = newItems.reduce((acc, item) => acc + item.qty, 0);
          const newTotalPrice = newItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

          return {
            cartsByUser: {
              ...state.cartsByUser,
              [uId]: { items: newItems, totalCount: newTotalCount, totalPrice: newTotalPrice }
            },
            items: newItems,
            totalCount: newTotalCount,
            totalPrice: newTotalPrice
          };
        });
      },

      updateQuantity: (itemId, qty) => {
        set((state) => {
          const uId = state.activeUserId;
          const userCart = state.cartsByUser[uId] || getEmptyCart();
          
          const newItems = userCart.items.map((item) => 
            item.id === itemId ? { ...item, qty } : item
          );
          const newTotalCount = newItems.reduce((acc, item) => acc + item.qty, 0);
          const newTotalPrice = newItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

          return {
            cartsByUser: {
              ...state.cartsByUser,
              [uId]: { items: newItems, totalCount: newTotalCount, totalPrice: newTotalPrice }
            },
            items: newItems,
            totalCount: newTotalCount,
            totalPrice: newTotalPrice
          };
        });
      },

      clearCart: () => {
        set((state) => {
          const uId = state.activeUserId;
          return {
            cartsByUser: {
              ...state.cartsByUser,
              [uId]: getEmptyCart()
            },
            items: [],
            totalCount: 0,
            totalPrice: 0
          };
        });
      },

      switchUser: (userId) => {
        set((state) => {
          const newUserId = userId || 'guest';
          
          // If we are logging in (switching FROM guest TO a real user)
          if (state.activeUserId === 'guest' && newUserId !== 'guest') {
            const guestCart = state.cartsByUser['guest'] || getEmptyCart();
            const userCart = state.cartsByUser[newUserId] || getEmptyCart();
            
            // Merge guest items into user cart. (A simple concat, could be enhanced to merge quantities)
            let mergedItems = [...userCart.items];
            guestCart.items.forEach(guestItem => {
              const existingIdx = mergedItems.findIndex(
                (item) => item.productId === guestItem.productId && 
                          item.variantId === guestItem.variantId &&
                          JSON.stringify(item.lensConfig) === JSON.stringify(guestItem.lensConfig)
              );
              if (existingIdx >= 0) {
                mergedItems[existingIdx].qty += guestItem.qty;
              } else {
                mergedItems.push(guestItem);
              }
            });

            const newTotalCount = mergedItems.reduce((acc, item) => acc + item.qty, 0);
            const newTotalPrice = mergedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

            return {
              activeUserId: newUserId,
              cartsByUser: {
                ...state.cartsByUser,
                'guest': getEmptyCart(), // clear guest cart after merge
                [newUserId]: { items: mergedItems, totalCount: newTotalCount, totalPrice: newTotalPrice }
              },
              items: mergedItems,
              totalCount: newTotalCount,
              totalPrice: newTotalPrice
            };
          }

          // Otherwise just switch normally (e.g. logging out or switching users)
          const targetCart = state.cartsByUser[newUserId] || getEmptyCart();
          
          return {
            activeUserId: newUserId,
            items: targetCart.items,
            totalCount: targetCart.totalCount,
            totalPrice: targetCart.totalPrice
          };
        });
      }
    }),
    {
      name: 'eyevengers-multi-cart', // rename to avoid persisting over the old format
      storage: createJSONStorage(() => localStorage),
      // We hydrate the active computed fields from cartsByUser when loading from storage
      onRehydrateStorage: () => (state) => {
        if (state) {
          const uId = state.activeUserId;
          const userCart = state.cartsByUser[uId] || getEmptyCart();
          state.items = userCart.items;
          state.totalCount = userCart.totalCount;
          state.totalPrice = userCart.totalPrice;
        }
      }
    }
  )
);
