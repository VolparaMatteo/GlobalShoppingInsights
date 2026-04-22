import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markRead, markAllRead } from '@/services/api/notifications.api';

/**
 * NOTE: The notification list is managed via the Zustand notificationStore
 * (populated over WebSocket / polling) rather than a React Query cache.
 * These mutation hooks call the API and then update the local store.
 */

/**
 * Marks a single notification as read on the server.
 */
export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => markRead(notificationId),
    onSuccess: () => {
      // Dashboard alerts badge may depend on unread notifications
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Marks all notifications as read on the server.
 */
export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
