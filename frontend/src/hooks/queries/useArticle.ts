import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import {
  getArticle,
  updateArticle,
  changeStatus,
} from '@/services/api/articles.api';
import type { ArticleUpdate, StatusChangeRequest } from '@/types';

/**
 * Fetches a single article by id.
 */
export function useArticle(id: string | number) {
  return useQuery({
    queryKey: queryKeys.articles.detail(id),
    queryFn: () => getArticle(id),
    enabled: !!id,
  });
}

/**
 * Updates fields on an existing article.
 * Invalidates article detail and list queries on success.
 */
export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ArticleUpdate }) =>
      updateArticle(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.lists() });
    },
  });
}

/**
 * Changes the workflow status of an article (e.g. imported -> screened -> in_review).
 * Invalidates article detail, list, and dashboard queries on success.
 */
export function useChangeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: StatusChangeRequest;
    }) => changeStatus(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.kpi() });
    },
  });
}
