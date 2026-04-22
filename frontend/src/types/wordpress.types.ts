// ---------------------------------------------------------------------------
// wordpress.types.ts  --  WordPress integration types
// Mirrors: backend/app/schemas/wordpress.py
// ---------------------------------------------------------------------------

/** Read-only WordPress configuration (password is never exposed). */
export interface WPConfig {
  wp_url: string | null;
  wp_username: string | null;
  has_password: boolean;
  default_author_id: number | null;
  last_sync_at: string | null; // ISO-8601 datetime
}

/** PATCH /wordpress/config request body. */
export interface WPConfigUpdate {
  wp_url?: string | null;
  wp_username?: string | null;
  wp_app_password?: string | null;
  default_author_id?: number | null;
}

/** Read-only WordPress post record. */
export interface WPPost {
  id: number;
  article_id: number;
  wp_post_id: number;
  wp_url: string | null;
  wp_status: string | null;
  published_at: string | null; // ISO-8601 datetime
  created_at: string | null; // ISO-8601 datetime
}
