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
 * - themeMode: preferenza light/dark (default LIGHT al primo accesso;
 *   l'utente puo' passare a dark dal toggle in header e la scelta
 *   persiste in localStorage 'gsi-ui')
 * - locale: lingua dell'interfaccia
 */
function detectInitialThemeMode(): ThemeMode {
  // Scelta di prodotto: sempre LIGHT al primo accesso, indipendentemente
  // dal prefers-color-scheme del sistema. Rende l'onboarding consistent
  // (la prima impressione e' sempre la palette brand chiara) — l'utente
  // puo' comunque passare a dark con il toggle luna/sole o ⌘+Shift+L.
  return 'light';
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
