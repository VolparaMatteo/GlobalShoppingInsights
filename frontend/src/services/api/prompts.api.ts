// ---------------------------------------------------------------------------
// services/api/prompts.api.ts  --  Search prompt CRUD + run
// ---------------------------------------------------------------------------
import client from './client';
import type { PaginatedResponse, Prompt, PromptCreate, PromptUpdate, SearchRun } from '@/types';

export interface GetPromptsParams {
  page?: number;
  page_size?: number;
  is_active?: boolean;
  search?: string;
  folder_id?: number;
  unfiled?: boolean;
}

/** GET /prompts */
export async function getPrompts(params?: GetPromptsParams): Promise<PaginatedResponse<Prompt>> {
  const { data } = await client.get<PaginatedResponse<Prompt>>('/prompts', {
    params,
  });
  return data;
}

/** POST /prompts */
export async function createPrompt(payload: PromptCreate): Promise<Prompt> {
  const { data } = await client.post<Prompt>('/prompts', payload);
  return data;
}

/** GET /prompts/:id */
export async function getPrompt(id: number): Promise<Prompt> {
  const { data } = await client.get<Prompt>(`/prompts/${id}`);
  return data;
}

/** PATCH /prompts/:id */
export async function updatePrompt(id: number, payload: PromptUpdate): Promise<Prompt> {
  const { data } = await client.patch<Prompt>(`/prompts/${id}`, payload);
  return data;
}

/** DELETE /prompts/:id */
export async function deletePrompt(id: number): Promise<void> {
  await client.delete(`/prompts/${id}`);
}

/** POST /prompts/:id/run  --  trigger a manual search execution */
export async function runPromptSearch(id: number): Promise<SearchRun> {
  const { data } = await client.post<SearchRun>(`/prompts/${id}/run`);
  return data;
}
