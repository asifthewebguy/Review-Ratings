import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '@review-ratings/shared';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  loginModalOpen: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      loginModalOpen: false,

      setAuth: (user, tokens) =>
        set({
          user,
          tokens,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      openLoginModal: () => set({ loginModalOpen: true }),
      closeLoginModal: () => set({ loginModalOpen: false }),

      refreshAccessToken: async () => {
        const refreshToken = useAuthStore.getState().tokens?.refreshToken;
        if (!refreshToken) return false;
        try {
          const res = await fetch('/api/v1/auth/token/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const data = await res.json();
          if (data.success && data.data?.tokens) {
            set((s) => ({ tokens: { ...s.tokens!, ...data.data.tokens } }));
            return true;
          }
        } catch {
          // network error — leave existing tokens
        }
        set({ user: null, tokens: null, isAuthenticated: false });
        return false;
      },
    }),
    {
      name: 'review-ratings-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
