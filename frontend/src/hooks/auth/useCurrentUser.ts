import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

/**
 * Returns the currently authenticated user from the auth store.
 * Returns `null` when no user is logged in.
 */
export function useCurrentUser(): User | null {
  return useAuthStore((s) => s.user);
}
