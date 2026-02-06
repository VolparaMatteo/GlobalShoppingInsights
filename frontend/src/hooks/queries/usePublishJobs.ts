import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import {
  getPublishJobs,
  publishArticle,
  retryPublish,
} from '@/services/api/publish.api';

/**
 * Fetches a paginated list of publish jobs with optional filters.
 */
export function usePublishJobs(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.publishJobs.list(filters),
    queryFn: () => getPublishJobs(filters),
  });
}

/**
 * Publishes a single article to WordPress.
 * Invalidates publish-job, article, and dashboard queries on success.
 */
export function usePublishArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: number) => publishArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.publishJobs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.kpi() });
    },
  });
}

/**
 * Retries a failed publish job.
 * Invalidates publish-job and article queries on success.
 */
export function useRetryPublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) => retryPublish(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.publishJobs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.kpi() });
    },
  });
}
