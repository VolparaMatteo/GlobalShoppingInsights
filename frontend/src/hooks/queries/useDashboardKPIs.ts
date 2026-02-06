import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { getDashboardKPIs, getRecentJobs, getAlerts } from '@/services/api/dashboard.api';

/**
 * Fetches the main dashboard KPI aggregates (article counts, search stats, etc.).
 */
export function useDashboardKPIs() {
  return useQuery({
    queryKey: queryKeys.dashboard.kpi(),
    queryFn: getDashboardKPIs,
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Fetches the most recent background jobs for the dashboard activity feed.
 */
export function useRecentJobs() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentJobs(),
    queryFn: getRecentJobs,
    staleTime: 15_000,
  });
}

/**
 * Fetches active dashboard alerts (publish failures, duplicate spikes, etc.).
 */
export function useDashboardAlerts() {
  return useQuery({
    queryKey: queryKeys.dashboard.alerts(),
    queryFn: getAlerts,
    staleTime: 30_000,
  });
}
