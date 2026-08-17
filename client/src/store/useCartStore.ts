import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface CartState {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  mergeServerCart: (serverItems: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalCount: 0,
      totalPrice: 0,

      addItem: (newItem) => {
        set((state) => {
          // Check if item already exists with exact same config
          const existingItemIndex = state.items.findIndex(
            (item) => item.productId === newItem.productId && 
                      item.variantId === newItem.variantId &&
                      JSON.stringify(item.lensConfig) === JSON.stringify(newItem.lensConfig)
          );

          let newItems = [...state.items];
          if (existingItemIndex >= 0) {
            newItems[existingItemIndex].qty += newItem.qty;
          } else {
            newItems.push(newItem);
          }

          return {
            items: newItems,
            totalCount: newItems.reduce((acc, item) => acc + item.qty, 0),
            totalPrice: newItems.reduce((acc, item) => acc + (item.price * item.qty), 0)
          };
        });
      },

      removeItem: (itemId) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== itemId);
          return {
            items: newItems,
            totalCount: newItems.reduce((acc, item) => acc + item.qty, 0),
            totalPrice: newItems.reduce((acc, item) => acc + (item.price * item.qty), 0)
          };
        });
      },

      updateQuantity: (itemId, qty) => {
        set((state) => {
          const newItems = state.items.map((item) => 
            item.id === itemId ? { ...item, qty } : item
          );
          return {
            items: newItems,
            totalCount: newItems.reduce((acc, item) => acc + item.qty, 0),
            totalPrice: newItems.reduce((acc, item) => acc + (item.price * item.qty), 0)
          };
        });
      },

      clearCart: () => set({ items: [], totalCount: 0, totalPrice: 0 }),
      
      mergeServerCart: (serverItems) => {
        set((state) => {
          // Simplistic merge for now: combine guests + server, could be improved to handle duplicates
          const merged = [...state.items, ...serverItems];
          return {
            items: merged,
            totalCount: merged.reduce((acc, item) => acc + item.qty, 0),
            totalPrice: merged.reduce((acc, item) => acc + (item.price * item.qty), 0)
          };
        });
      }
    }),
    {
      name: 'eyevengers-cart',
    }
  )
);
