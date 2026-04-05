// ---------------------------------------------------------------------------
// article.types.ts  --  Article domain types
// Mirrors: backend/app/schemas/article.py
// ---------------------------------------------------------------------------

import type { Tag } from "./taxonomy.types";
import type { Category } from "./taxonomy.types";

/** Lightweight prompt info attached to an article. */
export interface PromptSummary {
  id: number;
  title: string;
  keywords: string[];
}

/** Read-only article representation returned by the API. */
export interface Article {
  id: number;
  canonical_url: string;
  source_domain: string;
  title: string;
  author: string | null;
  published_at: string | null;        // ISO-8601 datetime
  language: string;
  country: string | null;
  content_html: string | null;
  content_text: string | null;
  status: string;
  featured_image_url: string | null;
  images: string[];
  is_paywalled: boolean;
  ai_score: number | null;
  ai_score_explanation: string[] | null;
  ai_suggested_tags: string[] | null;
  ai_suggested_category: string | null;
  ai_relevance_comment: string | null;
  duplicate_of_id: number | null;
  created_at: string;                  // ISO-8601 datetime
  updated_at: string;                  // ISO-8601 datetime
  tags: Tag[];
  categories: Category[];
  prompts: PromptSummary[];
}

/** PATCH /articles/:id request body. All fields optional. */
export interface ArticleUpdate {
  title?: string | null;
  content_html?: string | null;
  content_text?: string | null;
  author?: string | null;
  language?: string | null;
  country?: string | null;
  featured_image_url?: string | null;
}

/** POST /articles/:id/status request body. */
export interface StatusChangeRequest {
  new_status: string;
  comment?: string | null;
}

/** POST /articles/batch request body. */
export interface BatchActionRequest {
  article_ids: number[];
  action: string; // "tag" | "status" | "discard"
  tag_ids?: number[] | null;
  category_ids?: number[] | null;
  new_status?: string | null;
}
