import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  membershipTier: 'none',
  isLoginModalOpen: false,
  pendingAction: null,

  login: (userData, tier = 'none') => set({ 
    user: userData, 
    isLoggedIn: true, 
    membershipTier: tier 
  }),
  
  logout: () => set({ 
    user: null, 
    isLoggedIn: false, 
    membershipTier: 'none',
    pendingAction: null
  }),
  
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
}));
