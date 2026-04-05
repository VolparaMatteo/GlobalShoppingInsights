import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import {
  getPromptFolders,
  createPromptFolder,
  updatePromptFolder,
  deletePromptFolder,
} from '@/services/api/promptFolders.api';
import type { PromptFolderCreate, PromptFolderUpdate } from '@/types';

/**
 * Fetches all prompt folders with prompt counts.
 */
export function usePromptFolders() {
  return useQuery({
    queryKey: queryKeys.promptFolders.list(),
    queryFn: getPromptFolders,
  });
}

/**
 * Creates a new prompt folder.
 */
export function useCreatePromptFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PromptFolderCreate) => createPromptFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promptFolders.all });
    },
  });
}

/**
 * Updates (renames) a prompt folder.
 */
export function useUpdatePromptFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PromptFolderUpdate }) =>
      updatePromptFolder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promptFolders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.lists() });
    },
  });
}

/**
 * Deletes a prompt folder (prompts are unlinked, not deleted).
 */
export function useDeletePromptFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePromptFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promptFolders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.lists() });
    },
  });
}
