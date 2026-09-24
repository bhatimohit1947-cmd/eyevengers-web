import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore';

export interface Address {
  id: string;
  userId: string;
  name?: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  label?: 'Home' | 'Work' | 'Other';
  isDefault?: boolean;
}

interface AddressState {
  addresses: Address[];

  // Actions
  addAddress: (address: Omit<Address, 'id' | 'userId'>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  getUserAddresses: () => Address[];
  getDefaultAddress: () => Address | undefined;
  syncWithServer: (phone?: string) => Promise<void>;
}

// Background helper to persist an address to cloud
const persistAddressToCloud = async (phone: string | undefined, address: Address) => {
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
    fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, address })
    }).catch(() => {});
  } catch(e) {}
};

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],

      addAddress: (addressData) => {
        const user = useAuthStore.getState().user;
        const currentUserId = user?.id || user?.phone;
        const userPhone = user?.phone;
        const { addresses } = get();
        if (!currentUserId) return;

        const newAddress: Address = {
          ...addressData,
          id: `ADDR-${Date.now()}`,
          userId: currentUserId,
          name: addressData.name || user?.name || 'Customer'
        };

        // If this is the first address, make it default
        const userAddresses = addresses.filter(a => a.userId === currentUserId || (userPhone && a.userId === userPhone));
        if (userAddresses.length === 0) {
          newAddress.isDefault = true;
        } else if (newAddress.isDefault) {
          // If adding a new default, unset others
          addresses.forEach(a => {
            if (a.userId === currentUserId || (userPhone && a.userId === userPhone)) a.isDefault = false;
          });
        }

        set({ addresses: [...addresses, newAddress] });

        // Save to cloud in background
        if (userPhone) {
          persistAddressToCloud(userPhone, newAddress);
        }
      },

      removeAddress: (id) => {
        const user = useAuthStore.getState().user;
        const currentUserId = user?.id || user?.phone;
        const userPhone = user?.phone;

        set((state) => {
          const newAddresses = state.addresses.filter((a) => a.id !== id);
          
          // If we deleted the default address, make the first remaining one default
          if (currentUserId) {
            const userAddrs = newAddresses.filter(a => a.userId === currentUserId || (userPhone && a.userId === userPhone));
            if (userAddrs.length > 0 && !userAddrs.some(a => a.isDefault)) {
              const firstAddrIdx = newAddresses.findIndex(a => a.id === userAddrs[0].id);
              if (firstAddrIdx >= 0) {
                newAddresses[firstAddrIdx].isDefault = true;
              }
            }
          }
          
          return { addresses: newAddresses };
        });

        // Delete from cloud in background
        if (userPhone) {
          const cleanPhone = userPhone.replace(/[^0-9]/g, '').slice(-10);
          fetch(`/api/addresses?id=${encodeURIComponent(id)}&phone=${cleanPhone}`, { method: 'DELETE' }).catch(() => {});
        }
      },

      setDefaultAddress: (id) => {
        const user = useAuthStore.getState().user;
        const currentUserId = user?.id || user?.phone;
        const userPhone = user?.phone;
        if (!currentUserId) return;

        let selectedAddr: Address | undefined;

        set((state) => ({
          addresses: state.addresses.map((addr) => {
            const matchUser = addr.userId === currentUserId || (userPhone && addr.userId === userPhone);
            if (!matchUser) return addr;
            const isMatch = addr.id === id;
            if (isMatch) selectedAddr = { ...addr, isDefault: true };
            return { ...addr, isDefault: isMatch };
          })
        }));

        if (userPhone && selectedAddr) {
          persistAddressToCloud(userPhone, selectedAddr);
        }
      },

      getUserAddresses: () => {
        const user = useAuthStore.getState().user;
        const currentUserId = user?.id;
        const userPhone = user?.phone;
        const { addresses } = get();
        if (!currentUserId && !userPhone) return [];
        return addresses.filter(a => a.userId === currentUserId || (userPhone && a.userId === userPhone) || (userPhone && a.userId === userPhone.replace(/[^0-9]/g, '').slice(-10))).sort((a, b) => {
          // Default address comes first
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return 0;
        });
      },
      
      getDefaultAddress: () => {
         const userAddrs = get().getUserAddresses();
         return userAddrs.find(a => a.isDefault) || userAddrs[0];
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
          const res = await fetch(`/api/addresses?phone=${cleanPhone}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.addresses)) {
              const serverList: Address[] = data.addresses;
              const currentState = get();

              // Merge local items with server items
              const map = new Map<string, Address>();
              serverList.forEach(a => map.set(a.id, a));
              currentState.addresses.forEach(a => {
                if (!map.has(a.id)) {
                  map.set(a.id, a);
                  // If local has extra address not on server, sync it
                  persistAddressToCloud(cleanPhone, a);
                }
              });

              set({ addresses: Array.from(map.values()) });
            }
          }
        } catch(e) {
          console.warn('Address server sync warning:', e);
        }
      }
    }),
    {
      name: 'eyevengers-address-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
