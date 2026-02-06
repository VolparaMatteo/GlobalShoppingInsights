import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import {
  getSlots as getCalendarSlots,
  createSlot,
  updateSlot,
  deleteSlot,
} from '@/services/api/calendar.api';
import type { SlotCreate, SlotUpdate } from '@/types';

/**
 * Fetches editorial calendar slots for the given date-range params.
 *
 * Typical params: { from: '2025-10-01', to: '2025-10-31' }
 */
export function useCalendarSlots(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.calendar.slots(params),
    queryFn: () => getCalendarSlots(params),
  });
}

/**
 * Creates a new editorial calendar slot.
 * Invalidates all calendar queries on success.
 */
export function useCreateSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SlotCreate) => createSlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

/**
 * Updates an existing editorial calendar slot.
 * Invalidates all calendar queries on success.
 */
export function useUpdateSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SlotUpdate }) =>
      updateSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

/**
 * Deletes an editorial calendar slot.
 * Invalidates all calendar queries on success.
 */
export function useDeleteSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}
