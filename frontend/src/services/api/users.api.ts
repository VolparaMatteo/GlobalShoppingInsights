// ---------------------------------------------------------------------------
// services/api/users.api.ts  --  User management endpoints
// ---------------------------------------------------------------------------
import client from "./client";
import type {
  PaginatedResponse,
  User,
  UserCreate,
  UserUpdate,
} from "@/types";

export interface GetUsersParams {
  page?: number;
  page_size?: number;
  role?: string;
  is_active?: boolean;
  search?: string;
}

/** GET /users */
export async function getUsers(
  params?: GetUsersParams,
): Promise<PaginatedResponse<User>> {
  const { data } = await client.get<PaginatedResponse<User>>("/users", {
    params,
  });
  return data;
}

/** POST /users */
export async function createUser(payload: UserCreate): Promise<User> {
  const { data } = await client.post<User>("/users", payload);
  return data;
}

/** GET /users/:id */
export async function getUser(id: number): Promise<User> {
  const { data } = await client.get<User>(`/users/${id}`);
  return data;
}

/** PATCH /users/:id */
export async function updateUser(
  id: number,
  payload: UserUpdate,
): Promise<User> {
  const { data } = await client.patch<User>(`/users/${id}`, payload);
  return data;
}

/** DELETE /users/:id */
export async function deleteUser(id: number): Promise<void> {
  await client.delete(`/users/${id}`);
}
