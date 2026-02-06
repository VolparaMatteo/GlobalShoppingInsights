import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import {
  getPrompts,
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  runPromptSearch,
} from '@/services/api/prompts.api';
import type { PromptCreate, PromptUpdate } from '@/types';

/**
 * Fetches a paginated list of prompts with optional filters.
 */
export function usePrompts(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.prompts.list(filters),
    queryFn: () => getPrompts(filters),
  });
}

/**
 * Fetches a single prompt by id.
 */
export function usePrompt(id: string | number) {
  return useQuery({
    queryKey: queryKeys.prompts.detail(id),
    queryFn: () => getPrompt(id),
    enabled: !!id,
  });
}

/**
 * Creates a new prompt.
 * Invalidates prompt list queries on success.
 */
export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PromptCreate) => createPrompt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.lists() });
    },
  });
}

/**
 * Updates an existing prompt.
 * Invalidates prompt list and detail queries on success.
 */
export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PromptUpdate }) =>
      updatePrompt(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.lists() });
    },
  });
}

/**
 * Deletes a prompt.
 * Invalidates prompt list queries on success.
 */
export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.lists() });
    },
  });
}

/**
 * Triggers a search run for a given prompt.
 * Invalidates search-run and prompt queries on success.
 */
export function useRunSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promptId: number) => runPromptSearch(promptId),
    onSuccess: (_result, promptId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.searchRuns(promptId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.searchRuns.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.kpi() });
    },
  });
}
