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

// ---------------------------------------------------------------------------
// Auto-plan settimanale
// ---------------------------------------------------------------------------

export type AutoPlanStrategy = 'cap' | 'spread';
export type AutoPlanCollisionStrategy = 'fail' | 'integrate' | 'replace';

/** POST /slots/auto-plan request body. */
export interface AutoPlanRequest {
  category: string;
  week_start: string; // ISO date YYYY-MM-DD (lunedì)
  publish_time: string; // HH:mm:ss (default 09:00:00)
  target_min_per_day: number;
  strategy: AutoPlanStrategy;
  collision_strategy: AutoPlanCollisionStrategy;
  timezone?: string; // default Europe/Rome
  dry_run: boolean;
}

export interface AutoPlanCandidate {
  article_id: number;
  title: string;
  ai_score: number | null;
  reading_time_min: number;
}

export interface AutoPlanExistingSlot {
  slot_id: number;
  article_id: number | null;
  article_title: string | null;
  scheduled_for: string; // ISO datetime
}

export interface AutoPlanDay {
  date: string; // ISO date
  scheduled_for: string; // ISO datetime
  articles: AutoPlanCandidate[];
  total_reading_min: number;
  existing_slots: AutoPlanExistingSlot[];
}

export interface AutoPlanSummary {
  pool_size: number;
  articles_planned: number;
  articles_unscheduled: number;
  total_reading_min: number;
  avg_reading_min_per_day: number;
  days_filled: number;
  collision_detected: boolean;
  existing_slots_in_week: number;
  warning: string | null;
  error: string | null;
}

/** POST /slots/auto-plan response body. */
export interface AutoPlanResponse {
  week_start: string; // ISO date
  week_end: string; // ISO date
  category: string;
  target_min_per_day: number;
  strategy: AutoPlanStrategy;
  days: AutoPlanDay[];
  summary: AutoPlanSummary;
  created_slot_ids: number[];
}
