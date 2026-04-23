// ---------------------------------------------------------------------------
// hooks/queries/useMyProfile.ts — self-service profile (Sprint 7 polish b5)
// ---------------------------------------------------------------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/config/queryKeys';
import { deleteMyAvatar, updateMyProfile, uploadMyAvatar } from '@/services/api/users.api';
import { useAuthStore } from '@/stores/authStore';
import type { User, UserSelfUpdate } from '@/types';

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: UserSelfUpdate) => updateMyProfile(payload),
    onSuccess: (user: User) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
    },
  });
}

export function useUploadMyAvatar() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (file: File) => uploadMyAvatar(file),
    onSuccess: (user: User) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
    },
  });
}

export function useDeleteMyAvatar() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: deleteMyAvatar,
    onSuccess: () => {
      if (user) setUser({ ...user, avatar_url: null });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
    },
  });
}
