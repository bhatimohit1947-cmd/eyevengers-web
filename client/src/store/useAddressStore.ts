import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore';

export interface Address {
  id: string;
  userId: string;
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
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],

      addAddress: (addressData) => {
        const currentUserId = useAuthStore.getState().user?.id;
        const { addresses } = get();
        if (!currentUserId) return;

        const newAddress: Address = {
          ...addressData,
          id: `ADDR-${Date.now()}`,
          userId: currentUserId,
        };

        // If this is the first address, make it default
        const userAddresses = addresses.filter(a => a.userId === currentUserId);
        if (userAddresses.length === 0) {
          newAddress.isDefault = true;
        } else if (newAddress.isDefault) {
          // If adding a new default, unset others
          addresses.forEach(a => {
            if (a.userId === currentUserId) a.isDefault = false;
          });
        }

        set({ addresses: [...addresses, newAddress] });
      },

      removeAddress: (id) => {
        set((state) => {
          const newAddresses = state.addresses.filter((a) => a.id !== id);
          
          // If we deleted the default address, make the first remaining one default
          const currentUserId = useAuthStore.getState().user?.id;
          if (currentUserId) {
            const userAddrs = newAddresses.filter(a => a.userId === currentUserId);
            if (userAddrs.length > 0 && !userAddrs.some(a => a.isDefault)) {
              const firstAddrIdx = newAddresses.findIndex(a => a.id === userAddrs[0].id);
              if (firstAddrIdx >= 0) {
                newAddresses[firstAddrIdx].isDefault = true;
              }
            }
          }
          
          return { addresses: newAddresses };
        });
      },

      setDefaultAddress: (id) => {
        const currentUserId = useAuthStore.getState().user?.id;
        if (!currentUserId) return;

        set((state) => ({
          addresses: state.addresses.map((addr) => {
            if (addr.userId !== currentUserId) return addr;
            return { ...addr, isDefault: addr.id === id };
          })
        }));
      },

      getUserAddresses: () => {
        const currentUserId = useAuthStore.getState().user?.id;
        const { addresses } = get();
        if (!currentUserId) return [];
        return addresses.filter(a => a.userId === currentUserId).sort((a, b) => {
          // Default address comes first
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return 0;
        });
      },
      
      getDefaultAddress: () => {
         const userAddrs = get().getUserAddresses();
         return userAddrs.find(a => a.isDefault) || userAddrs[0];
      }
    }),
    {
      name: 'eyevengers-address-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
