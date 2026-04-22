// ---------------------------------------------------------------------------
// services/api/dashboard.api.ts  --  Dashboard / KPI endpoints
// ---------------------------------------------------------------------------
import client from './client';
import type { JobLog } from '@/types';

/** Key performance indicators for the dashboard overview. */
export interface DashboardKPIs {
  total_articles: number;
  by_status: Record<string, number>;
  new_this_week: number;
  avg_ai_score: number | null;
  pending_slots: number;
}

/** GET /dashboard/kpis */
export async function getKPIs(): Promise<DashboardKPIs> {
  const { data } = await client.get<DashboardKPIs>('/dashboard/kpis');
  return data;
}

/** Alias used by the useDashboardKPIs hook. */
export const getDashboardKPIs = getKPIs;

/** GET /dashboard/recent-jobs */
export async function getRecentJobs(limit?: number): Promise<JobLog[]> {
  const { data } = await client.get<JobLog[]>('/dashboard/recent-jobs', {
    params: limit ? { limit } : undefined,
  });
  return data;
}

/** A single dashboard alert / warning. */
export interface DashboardAlert {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string; // ISO-8601
}

/** GET /dashboard/alerts */
export async function getAlerts(): Promise<DashboardAlert[]> {
  const { data } = await client.get<DashboardAlert[]>('/dashboard/alerts');
  return data;
}
