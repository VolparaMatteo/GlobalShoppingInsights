import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { getArticles, batchAction } from '@/services/api/articles.api';
import type { BatchActionRequest } from '@/types';

/**
 * Fetches a paginated, filterable list of articles.
 *
 * Typical filters: status, language, country, tag_ids, category_ids,
 * search (text), sort_by, sort_order, page, page_size.
 */
export function useArticles(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.articles.list(filters),
    queryFn: () => getArticles(filters),
    placeholderData: (prev) => prev, // keep previous data while fetching
  });
}

/**
 * Performs a batch action on multiple articles (tag, status change, discard).
 * Invalidates article list and dashboard KPI queries on success.
 */
export function useBatchAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BatchActionRequest) => batchAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.kpi() });
    },
  });
}
