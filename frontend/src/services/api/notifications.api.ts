// ---------------------------------------------------------------------------
// services/api/notifications.api.ts  --  User notification endpoints
// ---------------------------------------------------------------------------
import client from "./client";
import type { PaginatedResponse, Notification, MessageResponse } from "@/types";

export interface GetNotificationsParams {
  page?: number;
  page_size?: number;
  is_read?: boolean;
}

/** GET /notifications */
export async function getNotifications(
  params?: GetNotificationsParams,
): Promise<PaginatedResponse<Notification>> {
  const { data } = await client.get<PaginatedResponse<Notification>>(
    "/notifications",
    { params },
  );
  return data;
}

/** PATCH /notifications/:id/read */
export async function markRead(id: number): Promise<Notification> {
  const { data } = await client.patch<Notification>(
    `/notifications/${id}/read`,
  );
  return data;
}

/** POST /notifications/read-all */
export async function markAllRead(): Promise<MessageResponse> {
  const { data } = await client.post<MessageResponse>(
    "/notifications/read-all",
  );
  return data;
}
