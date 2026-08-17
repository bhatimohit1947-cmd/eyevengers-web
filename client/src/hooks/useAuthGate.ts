import { useAuthStore } from '@/store/useAuthStore';

export function useAuthGate() {
  const { isLoggedIn, openLoginModal } = useAuthStore();

  const requireAuth = (action: () => void) => {
    if (isLoggedIn) {
      action();
    } else {
      openLoginModal(action);
    }
  };

  return { requireAuth };
}
