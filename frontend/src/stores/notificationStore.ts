// ---------------------------------------------------------------------------
// stores/notificationStore.ts  --  Notification state
// ---------------------------------------------------------------------------
import { create } from "zustand";

export interface StoreNotification {
  id: number;
  title: string;
  message: string;
  read: boolean;
}

interface NotificationState {
  unreadCount: number;
  notifications: StoreNotification[];

  setUnreadCount: (count: number) => void;
  setNotifications: (items: StoreNotification[]) => void;
  increment: () => void;
  decrement: () => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  notifications: [],

  setUnreadCount: (count: number) => set({ unreadCount: count }),

  setNotifications: (items: StoreNotification[]) =>
    set({
      notifications: items,
      unreadCount: items.filter((n) => !n.read).length,
    }),

  increment: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrement: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  markAsRead: (id: number) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}));
