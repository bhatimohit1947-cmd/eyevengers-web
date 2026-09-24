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
  mrp?: number;
  categoryId?: string;
  brandId?: string;
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
  switchUser: (userId: string | null, userPhone?: string) => void;
  syncWithServer: (phone?: string) => Promise<void>;
}

const getEmptyCart = (): UserCart => ({
  items: [],
  totalCount: 0,
  totalPrice: 0,
});

// Background helper to persist cart to cloud
const persistCartToCloud = async (phone: string | undefined, items: CartItem[]) => {
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
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, items })
    }).catch(() => {});
  } catch(e) {}
};

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

          if (uId !== 'guest') {
            persistCartToCloud(uId, newItems);
          }

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

          if (uId !== 'guest') {
            persistCartToCloud(uId, newItems);
          }

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

          if (uId !== 'guest') {
            persistCartToCloud(uId, newItems);
          }

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
        const uId = get().activeUserId;
        if (uId !== 'guest') {
          persistCartToCloud(uId, []);
        }

        set((state) => {
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

      switchUser: (userId, userPhone) => {
        set((state) => {
          const newUserId = userId || 'guest';
          
          // If we are logging in (switching FROM guest TO a real user)
          if (state.activeUserId === 'guest' && newUserId !== 'guest') {
            const guestCart = state.cartsByUser['guest'] || getEmptyCart();
            const userCart = state.cartsByUser[newUserId] || getEmptyCart();
            
            // Merge guest items into user cart
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

            if (userPhone || newUserId) {
              persistCartToCloud(userPhone || newUserId, mergedItems);
            }

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

          // Otherwise just switch normally
          const targetCart = state.cartsByUser[newUserId] || getEmptyCart();
          
          return {
            activeUserId: newUserId,
            items: targetCart.items,
            totalCount: targetCart.totalCount,
            totalPrice: targetCart.totalPrice
          };
        });

        // Trigger background sync with server
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
          const res = await fetch(`/api/cart?phone=${cleanPhone}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.cart) {
              const serverItems = Array.isArray(data.cart.items) ? data.cart.items : [];
              const currentState = get();
              const activeId = currentState.activeUserId;

              // If server has items, merge them with local or adopt server items
              let combinedItems = [...serverItems];
              currentState.items.forEach(localItem => {
                const exists = combinedItems.some(si => 
                  si.productId === localItem.productId && 
                  si.variantId === localItem.variantId &&
                  JSON.stringify(si.lensConfig) === JSON.stringify(localItem.lensConfig)
                );
                if (!exists) {
                  combinedItems.push(localItem);
                }
              });

              const count = combinedItems.reduce((sum, i) => sum + (Number(i.qty) || 1), 0);
              const price = combinedItems.reduce((sum, i) => sum + ((Number(i.price) || 0) * (Number(i.qty) || 1)), 0);

              set((state) => ({
                cartsByUser: {
                  ...state.cartsByUser,
                  [activeId]: { items: combinedItems, totalCount: count, totalPrice: price }
                },
                items: combinedItems,
                totalCount: count,
                totalPrice: price
              }));

              // If local had extra items not on server, sync combined back
              if (combinedItems.length !== serverItems.length) {
                persistCartToCloud(cleanPhone, combinedItems);
              }
            }
          }
        } catch (e) {
          console.warn('Cart server sync warning:', e);
        }
      }
    }),
    {
      name: 'eyevengers-multi-cart',
      storage: createJSONStorage(() => localStorage),
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
