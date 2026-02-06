import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/api/taxonomy.api';
import type {
  TagCreate,
  TagUpdate,
  CategoryCreate,
  CategoryUpdate,
} from '@/types';

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

/** Fetches all tags. */
export function useTags() {
  return useQuery({
    queryKey: queryKeys.taxonomy.tags(),
    queryFn: getTags,
    staleTime: 60_000, // tags change infrequently
  });
}

/** Creates a new tag. Invalidates tag list on success. */
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TagCreate) => createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.tags() });
    },
  });
}

/** Updates an existing tag. Invalidates tag list on success. */
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TagUpdate }) =>
      updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.tags() });
    },
  });
}

/** Deletes a tag. Invalidates tag list on success. */
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.tags() });
    },
  });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/** Fetches all categories. */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.taxonomy.categories(),
    queryFn: getCategories,
    staleTime: 60_000,
  });
}

/** Creates a new category. Invalidates category list on success. */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryCreate) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.taxonomy.categories(),
      });
    },
  });
}

/** Updates an existing category. Invalidates category list on success. */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryUpdate }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.taxonomy.categories(),
      });
    },
  });
}

/** Deletes a category. Invalidates category list on success. */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.taxonomy.categories(),
      });
    },
  });
}
