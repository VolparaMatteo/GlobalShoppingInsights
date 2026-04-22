// ---------------------------------------------------------------------------
// job.types.ts  --  Background job log types
// Mirrors: backend/app/models/logs.py  (JobLog model)
// ---------------------------------------------------------------------------

/** Read-only job log entry. */
export interface JobLog {
  id: number;
  job_type: string;
  entity_ref: string | null;
  status: string;
  started_at: string; // ISO-8601 datetime
  ended_at: string | null; // ISO-8601 datetime
  error: string | null;
  payload: Record<string, unknown> | null;
  progress: number | null;
}
