// ---------------------------------------------------------------------------
// stores/uiStore.ts  --  General UI state (sidebar, locale, theme mode)
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface UiState {
  sidebarCollapsed: boolean;
  locale: string;
  themeMode: ThemeMode;

  toggleSidebar: () => void;
  setLocale: (locale: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

/**
 * Stato UI persistito in localStorage:
 * - sidebarCollapsed: preferenza di collapse
 * - themeMode: preferenza light/dark (fallback a prefers-color-scheme al primo avvio)
 * - locale: lingua dell'interfaccia
 */
function detectInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  return mq?.matches ? 'dark' : 'light';
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      locale: 'it',
      themeMode: detectInitialThemeMode(),

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setLocale: (locale: string) => set({ locale }),

      setThemeMode: (themeMode: ThemeMode) => set({ themeMode }),

      toggleThemeMode: () =>
        set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'gsi-ui',
      version: 1,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        locale: state.locale,
        themeMode: state.themeMode,
      }),
    },
  ),
);
