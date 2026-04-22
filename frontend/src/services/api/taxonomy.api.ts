// ---------------------------------------------------------------------------
// services/api/taxonomy.api.ts  --  Tags & Categories CRUD + WP sync
// ---------------------------------------------------------------------------
import client from './client';
import type {
  PaginatedResponse,
  Tag,
  TagCreate,
  TagUpdate,
  Category,
  CategoryCreate,
  CategoryUpdate,
  MessageResponse,
} from '@/types';

// ---- Tags ----------------------------------------------------------------

export interface GetTagsParams {
  page?: number;
  page_size?: number;
  search?: string;
}

/** GET /tags */
export async function getTags(params?: GetTagsParams): Promise<PaginatedResponse<Tag>> {
  const { data } = await client.get<PaginatedResponse<Tag>>('/tags', {
    params,
  });
  return data;
}

/** POST /tags */
export async function createTag(payload: TagCreate): Promise<Tag> {
  const { data } = await client.post<Tag>('/tags', payload);
  return data;
}

/** PATCH /tags/:id */
export async function updateTag(id: number, payload: TagUpdate): Promise<Tag> {
  const { data } = await client.patch<Tag>(`/tags/${id}`, payload);
  return data;
}

/** DELETE /tags/:id */
export async function deleteTag(id: number): Promise<void> {
  await client.delete(`/tags/${id}`);
}

// ---- Categories ----------------------------------------------------------

export interface GetCategoriesParams {
  page?: number;
  page_size?: number;
  search?: string;
  parent_id?: number;
}

/** GET /categories */
export async function getCategories(
  params?: GetCategoriesParams,
): Promise<PaginatedResponse<Category>> {
  const { data } = await client.get<PaginatedResponse<Category>>('/categories', { params });
  return data;
}

/** POST /categories */
export async function createCategory(payload: CategoryCreate): Promise<Category> {
  const { data } = await client.post<Category>('/categories', payload);
  return data;
}

/** PATCH /categories/:id */
export async function updateCategory(id: number, payload: CategoryUpdate): Promise<Category> {
  const { data } = await client.patch<Category>(`/categories/${id}`, payload);
  return data;
}

/** DELETE /categories/:id */
export async function deleteCategory(id: number): Promise<void> {
  await client.delete(`/categories/${id}`);
}

// ---- WP Sync -------------------------------------------------------------

/** POST /taxonomy/sync-wp  --  sync tags & categories with WordPress */
export async function syncWP(): Promise<MessageResponse> {
  const { data } = await client.post<MessageResponse>('/taxonomy/sync-wp');
  return data;
}
