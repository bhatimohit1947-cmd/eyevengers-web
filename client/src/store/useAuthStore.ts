import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useCartStore } from './useCartStore';
import { useWishlistStore } from './useWishlistStore';

interface User {
  id: string;
  googleProviderId?: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  membershipTier: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  isLoginModalOpen: boolean;
  pendingAction: (() => void) | null;
  
  // Actions
  login: (userData: User, tier?: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum') => void;
  logout: () => void;
  setMembershipTier: (tier: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum') => void;
  purchaseMembership: (tier: 'bronze' | 'silver' | 'gold' | 'platinum') => void;
  openLoginModal: (pendingAction?: () => void) => void;
  closeLoginModal: () => void;
  executePendingAction: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      membershipTier: 'none',
      isLoginModalOpen: false,
      pendingAction: null,

      login: (userData, tier = 'none') => {
        set({ 
          user: userData, 
          isLoggedIn: true, 
          membershipTier: tier 
        });
        useCartStore.getState().switchUser(userData.id);
        useWishlistStore.getState().switchUser(userData.id);
      },
      
      logout: () => {
        set({ 
          user: null, 
          isLoggedIn: false, 
          membershipTier: 'none',
          pendingAction: null
        });
        useCartStore.getState().switchUser(null);
        useWishlistStore.getState().switchUser(null);
      },
      
      setMembershipTier: (tier) => set({ membershipTier: tier }),
      
      purchaseMembership: (tier) => set({ membershipTier: tier }),
      
      openLoginModal: (pendingAction = undefined) => set({ 
        isLoginModalOpen: true, 
        pendingAction: pendingAction || null 
      }),
      
      closeLoginModal: () => set({ 
        isLoginModalOpen: false, 
        pendingAction: null 
      }),
      
      executePendingAction: () => {
        const { pendingAction } = get();
        if (pendingAction) {
          pendingAction();
          set({ pendingAction: null });
        }
      }
    }),
    {
      name: 'eyevengers-auth-storage', // unique name
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isLoggedIn: state.isLoggedIn, 
        membershipTier: state.membershipTier 
      }), // only persist user state, not UI state like login modal
    }
  )
);
