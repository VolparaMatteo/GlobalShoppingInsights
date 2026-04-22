// ---------------------------------------------------------------------------
// stores/authStore.ts  --  Authentication state (Zustand + persist)
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  /** Authenticate with email & password, stores tokens + user profile. */
  login: (email: string, password: string) => Promise<void>;

  /** Clear all auth state and redirect-ready. */
  logout: () => void;

  /** Replace the current token pair (e.g. after a silent refresh). */
  setTokens: (accessToken: string, refreshToken: string) => void;

  /** Replace the cached user profile. */
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      login: async (email: string, password: string) => {
        // Lazy-import to break circular dep (client.ts reads authStore)
        const { login: apiLogin, getMe } = await import('@/services/api/auth.api');
        const tokens = await apiLogin({ email, password });
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        });
        const user = await getMe();
        set({ user });
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      setUser: (user: User | null) => {
        set({ user });
      },
    }),
    {
      name: 'gsi-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
