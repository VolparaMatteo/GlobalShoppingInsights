// ---------------------------------------------------------------------------
// services/api/calendar.api.ts  --  Editorial calendar endpoints
// ---------------------------------------------------------------------------
import client from "./client";
import type {
  EditorialSlot,
  SlotCreate,
  SlotUpdate,
  CalendarRule,
  CalendarRuleUpdate,
  CollisionCheckRequest,
  CollisionCheckResponse,
} from "@/types";

export interface GetSlotsParams {
  from?: string; // ISO-8601 date
  to?: string;   // ISO-8601 date
  status?: string;
}

/** GET /calendar/slots */
export async function getSlots(
  params?: GetSlotsParams,
): Promise<EditorialSlot[]> {
  const { data } = await client.get<EditorialSlot[]>("/calendar/slots", {
    params,
  });
  return data;
}

/** POST /calendar/slots */
export async function createSlot(payload: SlotCreate): Promise<EditorialSlot> {
  const { data } = await client.post<EditorialSlot>(
    "/calendar/slots",
    payload,
  );
  return data;
}

/** PATCH /calendar/slots/:id */
export async function updateSlot(
  id: number,
  payload: SlotUpdate,
): Promise<EditorialSlot> {
  const { data } = await client.patch<EditorialSlot>(
    `/calendar/slots/${id}`,
    payload,
  );
  return data;
}

/** DELETE /calendar/slots/:id */
export async function deleteSlot(id: number): Promise<void> {
  await client.delete(`/calendar/slots/${id}`);
}

/** POST /calendar/slots/collision-check */
export async function checkCollision(
  payload: CollisionCheckRequest,
): Promise<CollisionCheckResponse> {
  const { data } = await client.post<CollisionCheckResponse>(
    "/calendar/slots/collision-check",
    payload,
  );
  return data;
}

/** GET /calendar/rules */
export async function getRules(): Promise<CalendarRule[]> {
  const { data } = await client.get<CalendarRule[]>("/calendar/rules");
  return data;
}

/** PATCH /calendar/rules/:id */
export async function updateRule(
  id: number,
  payload: CalendarRuleUpdate,
): Promise<CalendarRule> {
  const { data } = await client.patch<CalendarRule>(
    `/calendar/rules/${id}`,
    payload,
  );
  return data;
}
