// ---------------------------------------------------------------------------
// settings.types.ts  --  Application settings types
// Mirrors: backend/app/schemas/settings.py
// ---------------------------------------------------------------------------

/** Scraping engine configuration. */
export interface ScrapingSettings {
  max_concurrent_requests: number; // default 5
  request_timeout_seconds: number; // default 30
  user_agent: string; // default "GSI-Bot/1.0"
  respect_robots_txt: boolean; // default true
}

/** Deduplication configuration. */
export interface DedupSettings {
  similarity_threshold: number; // default 0.85
  use_content_hash: boolean; // default true
  use_semantic_similarity: boolean; // default true
}

/** Read-only blacklist entry. */
export interface BlacklistEntry {
  id: number;
  domain: string;
  reason: string | null;
  added_by: number | null;
}

/** POST /settings/blacklist request body. */
export interface BlacklistCreate {
  domain: string;
  reason?: string | null;
}
