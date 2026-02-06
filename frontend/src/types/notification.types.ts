// ---------------------------------------------------------------------------
// notification.types.ts  --  User notification types
// Mirrors: backend/app/schemas/notification.py
// ---------------------------------------------------------------------------

/** Read-only notification. */
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  created_at: string; // ISO-8601 datetime
}
