// ---------------------------------------------------------------------------
// services/api/calendar.api.ts  --  Editorial calendar endpoints
// ---------------------------------------------------------------------------
import client from './client';
import type {
  EditorialSlot,
  SlotCreate,
  SlotUpdate,
  CalendarRule,
  CalendarRuleUpdate,
  CollisionCheckRequest,
  CollisionCheckResponse,
} from '@/types';

export interface GetSlotsParams {
  from?: string; // ISO-8601 date
  to?: string; // ISO-8601 date
  status?: string;
}

/** GET /slots */
export async function getSlots(params?: GetSlotsParams): Promise<EditorialSlot[]> {
  // Backend expects 'start'/'end', frontend uses 'from'/'to'
  const apiParams: Record<string, unknown> = { ...params };
  if (apiParams.from) {
    apiParams.start = apiParams.from;
    delete apiParams.from;
  }
  if (apiParams.to) {
    apiParams.end = apiParams.to;
    delete apiParams.to;
  }
  const { data } = await client.get<EditorialSlot[]>('/slots', {
    params: apiParams,
  });
  return data;
}

/** POST /slots */
export async function createSlot(payload: SlotCreate): Promise<EditorialSlot> {
  const { data } = await client.post<EditorialSlot>('/slots', payload);
  return data;
}

/** PATCH /slots/:id */
export async function updateSlot(id: number, payload: SlotUpdate): Promise<EditorialSlot> {
  const { data } = await client.patch<EditorialSlot>(`/slots/${id}`, payload);
  return data;
}

/** DELETE /slots/:id */
export async function deleteSlot(id: number): Promise<void> {
  await client.delete(`/slots/${id}`);
}

/** POST /slots/check-collision */
export async function checkCollision(
  payload: CollisionCheckRequest,
): Promise<CollisionCheckResponse> {
  const { data } = await client.post<CollisionCheckResponse>('/slots/check-collision', payload);
  return data;
}

/** GET /slots/rules */
export async function getRules(): Promise<CalendarRule[]> {
  const { data } = await client.get<CalendarRule[]>('/slots/rules');
  return data;
}

/** PATCH /slots/rules/:id */
export async function updateRule(id: number, payload: CalendarRuleUpdate): Promise<CalendarRule> {
  const { data } = await client.patch<CalendarRule>(`/slots/rules/${id}`, payload);
  return data;
}
