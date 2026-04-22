// ---------------------------------------------------------------------------
// services/api/audit.api.ts  --  Audit log endpoints
// ---------------------------------------------------------------------------
import client from './client';
import type { PaginatedResponse, AuditLog } from '@/types';

export interface GetAuditLogsParams {
  page?: number;
  page_size?: number;
  user_id?: number;
  action?: string;
  entity?: string;
  entity_id?: number;
  from?: string; // ISO-8601 datetime
  to?: string; // ISO-8601 datetime
}

/** GET /audit-logs */
export async function getAuditLogs(
  params?: GetAuditLogsParams,
): Promise<PaginatedResponse<AuditLog>> {
  const { data } = await client.get<PaginatedResponse<AuditLog>>('/audit-logs', { params });
  return data;
}
