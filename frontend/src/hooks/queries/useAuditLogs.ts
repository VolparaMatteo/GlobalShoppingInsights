import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '@/services/api/audit.api';

/**
 * Fetches a paginated list of audit log entries with optional filters.
 *
 * Typical filters: user_id, action, entity, entity_id, from, to,
 * page, page_size, sort_by, sort_order.
 */
export function useAuditLogs(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['auditLogs', 'list', filters] as const,
    queryFn: () => getAuditLogs(filters),
    placeholderData: (prev) => prev,
  });
}
