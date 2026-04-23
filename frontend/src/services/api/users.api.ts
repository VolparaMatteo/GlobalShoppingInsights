// ---------------------------------------------------------------------------
// services/api/users.api.ts  --  User management endpoints
// ---------------------------------------------------------------------------
import client from './client';
import type { PaginatedResponse, User, UserCreate, UserSelfUpdate, UserUpdate } from '@/types';

// ---- Self-service profile ---------------------------------------------------

/** PATCH /users/me */
export async function updateMyProfile(payload: UserSelfUpdate): Promise<User> {
  const { data } = await client.patch<User>('/users/me', payload);
  return data;
}

/** POST /users/me/avatar (multipart/form-data). */
export async function uploadMyAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post<User>('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** DELETE /users/me/avatar */
export async function deleteMyAvatar(): Promise<void> {
  await client.delete('/users/me/avatar');
}

// ---- Admin users management -------------------------------------------------

export interface GetUsersParams {
  page?: number;
  page_size?: number;
  role?: string;
  is_active?: boolean;
  search?: string;
}

/** GET /users */
export async function getUsers(params?: GetUsersParams): Promise<PaginatedResponse<User>> {
  const { data } = await client.get<PaginatedResponse<User>>('/users', {
    params,
  });
  return data;
}

/** POST /users */
export async function createUser(payload: UserCreate): Promise<User> {
  const { data } = await client.post<User>('/users', payload);
  return data;
}

/** GET /users/:id */
export async function getUser(id: number): Promise<User> {
  const { data } = await client.get<User>(`/users/${id}`);
  return data;
}

/** PATCH /users/:id */
export async function updateUser(id: number, payload: UserUpdate): Promise<User> {
  const { data } = await client.patch<User>(`/users/${id}`, payload);
  return data;
}

/** DELETE /users/:id */
export async function deleteUser(id: number): Promise<void> {
  await client.delete(`/users/${id}`);
}
