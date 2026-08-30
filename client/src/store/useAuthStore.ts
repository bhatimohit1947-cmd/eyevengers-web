import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useCartStore } from './useCartStore';
import { useWishlistStore } from './useWishlistStore';
import { useAddressStore } from './useAddressStore';

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
  membershipBenefits?: {
    discountPercent?: number;
    freeShipping?: boolean;
    bogoOffer?: boolean;
  };
  isLoginModalOpen: boolean;
  pendingAction: (() => void) | null;
  
  // Actions
  login: (userData: User, tier?: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum', benefits?: any) => void;
  logout: () => void;
  setMembershipTier: (tier: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum', benefits?: any) => void;
  purchaseMembership: (tier: 'bronze' | 'silver' | 'gold' | 'platinum', benefits?: any) => void;
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
      membershipBenefits: undefined,
      isLoginModalOpen: false,
      pendingAction: null,

      login: (userData, tier = 'none', benefits = undefined) => {
        set({ 
          user: userData, 
          isLoggedIn: true, 
          membershipTier: tier,
          membershipBenefits: benefits
        });
        useCartStore.getState().switchUser(userData.id);
        useWishlistStore.getState().switchUser(userData.id);
      },
      
      logout: () => {
        set({ 
          user: null, 
          isLoggedIn: false, 
          membershipTier: 'none',
          membershipBenefits: undefined,
          pendingAction: null
        });
        useCartStore.getState().switchUser(null);
        useWishlistStore.getState().switchUser(null);
      },
      
      setMembershipTier: (tier, benefits) => set({ membershipTier: tier, membershipBenefits: benefits }),
      
      purchaseMembership: (tier, benefits) => set({ membershipTier: tier, membershipBenefits: benefits }),
      
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
        membershipTier: state.membershipTier,
        membershipBenefits: state.membershipBenefits
      }), // only persist user state, not UI state like login modal
    }
  )
);
