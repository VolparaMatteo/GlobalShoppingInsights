// ---------------------------------------------------------------------------
// Global Shopping Insights - Route Path Constants
// ---------------------------------------------------------------------------

export const ROUTES = {
  /** Main dashboard with KPIs and alerts. */
  DASHBOARD: '/',

  /** Authentication - login page. */
  LOGIN: '/login',

  /** Prompt management - list & create. */
  PROMPTS: '/prompts',

  /** Single prompt detail / editor (`:id` param). */
  PROMPT_DETAIL: '/prompts/:id',

  /** Editorial inbox - imported articles list with filters. */
  INBOX: '/inbox',

  /** Single article detail view (`:id` param). */
  ARTICLE_DETAIL: '/articles/:id',

  /** Editorial calendar - month / week / day views. */
  CALENDAR: '/calendar',

  /** Taxonomy management - tags & categories with WP mapping. */
  TAXONOMY: '/taxonomy',

  /** Admin settings - WP credentials, blacklist, scraping params, etc. */
  SETTINGS: '/settings',
} as const;

// ---------------------------------------------------------------------------
// Helper to build parameterised paths at runtime
// ---------------------------------------------------------------------------

/** Replace `:id` placeholder with the actual identifier. */
export function buildPromptDetailPath(id: string | number): string {
  return ROUTES.PROMPT_DETAIL.replace(':id', String(id));
}

export function buildArticleDetailPath(id: string | number): string {
  return ROUTES.ARTICLE_DETAIL.replace(':id', String(id));
}
