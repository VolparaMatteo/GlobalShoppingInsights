// ---------------------------------------------------------------------------
// hooks/queries/useJobLogs.ts — storico paginato dei job_logs
// ---------------------------------------------------------------------------
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/config/queryKeys';
import { getJobLogs, type JobLogsParams } from '@/services/api/dashboard.api';

/**
 * Lista paginata di job_logs filtrabile per status/job_type.
 * Usato da /dashboard/alerts (AlertsPage).
 */
export function useJobLogs(params: JobLogsParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.alerts(), 'jobLogs', params],
    queryFn: () => getJobLogs(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000, // refresh periodico — gli alert sono time-sensitive
  });
}
