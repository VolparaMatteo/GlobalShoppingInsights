// ---------------------------------------------------------------------------
// search.types.ts  --  Search run & result types
// Mirrors: backend/app/schemas/search.py
// ---------------------------------------------------------------------------

/** A single search result (URL-level). */
export interface SearchResult {
  id: number;
  url: string;
  title: string | null;
  snippet: string | null;
  provider: string;
  published_at_est: string | null; // ISO-8601 datetime
  domain: string | null;
  language_est: string | null;
  article_id: number | null;
}

/** One execution of a prompt search. */
export interface SearchRun {
  id: number;
  prompt_id: number;
  triggered_by: number | null;
  started_at: string;              // ISO-8601 datetime
  ended_at: string | null;         // ISO-8601 datetime
  status: string;
  urls_found: number;
  articles_created: number;
  duplicates_skipped: number;
  errors_count: number;
  error_message: string | null;
  results: SearchResult[] | null;
}
