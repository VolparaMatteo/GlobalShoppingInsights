// ---------------------------------------------------------------------------
// stores/uiStore.ts  --  General UI state (sidebar, locale, etc.)
// ---------------------------------------------------------------------------
import { create } from "zustand";

interface UiState {
  sidebarCollapsed: boolean;
  locale: string;

  toggleSidebar: () => void;
  setLocale: (locale: string) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarCollapsed: false,
  locale: "en",

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setLocale: (locale: string) => set({ locale }),
}));
