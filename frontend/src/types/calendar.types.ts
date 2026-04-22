// ---------------------------------------------------------------------------
// calendar.types.ts  --  Editorial calendar types
// Mirrors: backend/app/schemas/calendar.py
// ---------------------------------------------------------------------------

/** Read-only editorial slot. */
export interface EditorialSlot {
  id: number;
  article_id: number | null;
  scheduled_for: string; // ISO-8601 datetime
  timezone: string;
  created_by: number | null;
  status: string;
  created_at: string | null; // ISO-8601 datetime
  article_title: string | null;
}

/** POST /calendar/slots request body. */
export interface SlotCreate {
  article_id: number;
  scheduled_for: string; // ISO-8601 datetime
  timezone?: string; // default "Europe/Rome"
}

/** PATCH /calendar/slots/:id request body. */
export interface SlotUpdate {
  scheduled_for?: string | null; // ISO-8601 datetime
  timezone?: string | null;
}

/** Read-only calendar rule. */
export interface CalendarRule {
  id: number;
  rule_type: string;
  value: number;
  is_active: boolean;
}

/** PATCH /calendar/rules/:id request body. */
export interface CalendarRuleUpdate {
  value?: number | null;
  is_active?: boolean | null;
}

/** POST /calendar/slots/collision-check request body. */
export interface CollisionCheckRequest {
  scheduled_for: string; // ISO-8601 datetime
  exclude_slot_id?: number | null;
}

/** POST /calendar/slots/collision-check response body. */
export interface CollisionCheckResponse {
  has_collision: boolean;
  existing_slots: EditorialSlot[];
}
