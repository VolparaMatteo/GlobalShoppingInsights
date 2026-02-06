// ---------------------------------------------------------------------------
// stores/calendarStore.ts  --  Editorial calendar UI state
// ---------------------------------------------------------------------------
import { create } from "zustand";

export type CalendarViewMode = "month" | "week" | "day";

export interface DragState {
  slotId: number | null;
  originDate: string | null;
  targetDate: string | null;
  isDragging: boolean;
}

interface CalendarState {
  viewMode: CalendarViewMode;
  currentDate: string; // ISO-8601 date string (YYYY-MM-DD)
  dragState: DragState;

  setViewMode: (mode: CalendarViewMode) => void;
  setCurrentDate: (date: string) => void;
  setDragState: (dragState: Partial<DragState>) => void;
}

const initialDragState: DragState = {
  slotId: null,
  originDate: null,
  targetDate: null,
  isDragging: false,
};

export const useCalendarStore = create<CalendarState>()((set) => ({
  viewMode: "month",
  currentDate: new Date().toISOString().slice(0, 10),
  dragState: { ...initialDragState },

  setViewMode: (mode: CalendarViewMode) => set({ viewMode: mode }),

  setCurrentDate: (date: string) => set({ currentDate: date }),

  setDragState: (partial: Partial<DragState>) =>
    set((state) => ({ dragState: { ...state.dragState, ...partial } })),
}));
