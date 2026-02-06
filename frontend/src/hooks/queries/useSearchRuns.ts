import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { getSearchRuns, getSearchRun } from '@/services/api/search.api';

/**
 * Fetches a paginated list of search runs with optional filters.
 */
export function useSearchRuns(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.searchRuns.list(filters),
    queryFn: () => getSearchRuns(filters),
  });
}

/**
 * Fetches a single search run by id, including its results.
 */
export function useSearchRun(id: string | number) {
  return useQuery({
    queryKey: queryKeys.searchRuns.detail(id),
    queryFn: () => getSearchRun(id),
    enabled: !!id,
  });
}
