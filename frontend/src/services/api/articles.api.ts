// ---------------------------------------------------------------------------
// services/api/articles.api.ts  --  Article CRUD, workflow & batch actions
// ---------------------------------------------------------------------------
import client from './client';
import type {
  PaginatedResponse,
  Article,
  ArticleUpdate,
  StatusChangeRequest,
  BatchActionRequest,
  ArticleRevision,
  MessageResponse,
} from '@/types';

export interface GetArticlesParams {
  page?: number;
  page_size?: number;
  status?: string;
  language?: string;
  country?: string;
  search?: string;
  tag_id?: number;
  category_id?: number;
  min_score?: number;
  max_score?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/** GET /articles */
export async function getArticles(params?: GetArticlesParams): Promise<PaginatedResponse<Article>> {
  const { data } = await client.get<PaginatedResponse<Article>>('/articles', {
    params,
  });
  return data;
}

/** GET /articles/:id */
export async function getArticle(id: number): Promise<Article> {
  const { data } = await client.get<Article>(`/articles/${id}`);
  return data;
}

/** PATCH /articles/:id */
export async function updateArticle(id: number, payload: ArticleUpdate): Promise<Article> {
  const { data } = await client.patch<Article>(`/articles/${id}`, payload);
  return data;
}

/** POST /articles/:id/status */
export async function changeStatus(
  id: number,
  payload: StatusChangeRequest,
  force = false,
): Promise<Article> {
  const { data } = await client.post<Article>(`/articles/${id}/status`, payload, {
    params: force ? { force: true } : undefined,
  });
  return data;
}

/** Allowed transitions for a given article status. */
export interface TransitionInfo {
  from: string;
  allowed: string[];
}

/** GET /articles/:id/transitions */
export async function getTransitions(id: number): Promise<TransitionInfo> {
  const { data } = await client.get<TransitionInfo>(`/articles/${id}/transitions`);
  return data;
}

/** GET /articles/:id/revisions */
export async function getRevisions(id: number): Promise<ArticleRevision[]> {
  const { data } = await client.get<ArticleRevision[]>(`/articles/${id}/revisions`);
  return data;
}

/** GET /articles/:id/duplicates */
export async function getDuplicates(id: number): Promise<Article[]> {
  const { data } = await client.get<Article[]>(`/articles/${id}/duplicates`);
  return data;
}

/** POST /articles/batch */
export async function batchAction(payload: BatchActionRequest): Promise<MessageResponse> {
  const { data } = await client.post<MessageResponse>('/articles/batch', payload);
  return data;
}

/** POST /articles/:id/translate */
export interface TranslateResponse {
  article_id: number;
  source_lang: string;
  target_lang: string;
  translated_title: string | null;
  translated_text: string | null;
}

export async function translateArticle(id: number, targetLang = 'it'): Promise<TranslateResponse> {
  const { data } = await client.post<TranslateResponse>(`/articles/${id}/translate`, null, {
    params: { target_lang: targetLang },
  });
  return data;
}

/** POST /articles/:id/upload-image */
export async function uploadArticleImage(id: number, file: File): Promise<Article> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post<Article>(`/articles/${id}/upload-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
