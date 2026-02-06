// ---------------------------------------------------------------------------
// audit.types.ts  --  Audit log types
// Mirrors: backend/app/models/logs.py  (AuditLog model)
// ---------------------------------------------------------------------------

/** Read-only audit log entry. */
export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  entity: string;
  entity_id: number | null;
  timestamp: string; // ISO-8601 datetime
  metadata: Record<string, unknown> | null;
}
