// ---------------------------------------------------------------------------
// Global Shopping Insights - React Query Key Factory
// ---------------------------------------------------------------------------
// Follows the factory pattern recommended by TanStack Query so that cache
// invalidation is predictable and composable.
//
// Usage:
//   useQuery({ queryKey: queryKeys.articles.detail(42), queryFn: ... })
//   queryClient.invalidateQueries({ queryKey: queryKeys.articles.all })
// ---------------------------------------------------------------------------

export const queryKeys = {
  // -- Articles -------------------------------------------------------------
  articles: {
    /** Root key for every article-related query. */
    all: ['articles'] as const,

    /** Paginated / filtered article lists. */
    lists: () => [...queryKeys.articles.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.articles.lists(), filters] as const,

    /** Single article by id. */
    details: () => [...queryKeys.articles.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.articles.details(), String(id)] as const,

    /** Comments for a specific article. */
    comments: (articleId: string | number) =>
      [...queryKeys.articles.detail(articleId), 'comments'] as const,

    /** Revision history for a specific article. */
    revisions: (articleId: string | number) =>
      [...queryKeys.articles.detail(articleId), 'revisions'] as const,
  },

  // -- Prompts --------------------------------------------------------------
  prompts: {
    all: ['prompts'] as const,

    lists: () => [...queryKeys.prompts.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.prompts.lists(), filters] as const,

    details: () => [...queryKeys.prompts.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.prompts.details(), String(id)] as const,

    /** Search runs belonging to a prompt. */
    searchRuns: (promptId: string | number) =>
      [...queryKeys.prompts.detail(promptId), 'searchRuns'] as const,
  },

  // -- Prompt Folders -------------------------------------------------------
  promptFolders: {
    all: ['promptFolders'] as const,
    list: () => [...queryKeys.promptFolders.all, 'list'] as const,
  },

  // -- Search Runs ----------------------------------------------------------
  searchRuns: {
    all: ['searchRuns'] as const,

    lists: () => [...queryKeys.searchRuns.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.searchRuns.lists(), filters] as const,

    detail: (id: string | number) => [...queryKeys.searchRuns.all, 'detail', String(id)] as const,
  },

  // -- Calendar / Editorial Slots -------------------------------------------
  calendar: {
    all: ['calendar'] as const,

    slots: (params: Record<string, unknown>) =>
      [...queryKeys.calendar.all, 'slots', params] as const,
  },

  // -- Taxonomy (Tags & Categories) -----------------------------------------
  taxonomy: {
    all: ['taxonomy'] as const,

    tags: () => [...queryKeys.taxonomy.all, 'tags'] as const,
    categories: () => [...queryKeys.taxonomy.all, 'categories'] as const,
  },

  // -- Users ----------------------------------------------------------------
  users: {
    all: ['users'] as const,

    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.users.lists(), filters] as const,

    detail: (id: string | number) => [...queryKeys.users.all, 'detail', String(id)] as const,

    /** The currently authenticated user. */
    me: () => [...queryKeys.users.all, 'me'] as const,
  },

  // -- Publishing Jobs ------------------------------------------------------
  publishJobs: {
    all: ['publishJobs'] as const,

    lists: () => [...queryKeys.publishJobs.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.publishJobs.lists(), filters] as const,
  },

  // -- Settings (Admin) -----------------------------------------------------
  settings: {
    all: ['settings'] as const,
    wordpress: () => [...queryKeys.settings.all, 'wordpress'] as const,
  },

  // -- Dashboard KPIs -------------------------------------------------------
  dashboard: {
    all: ['dashboard'] as const,
    kpi: () => [...queryKeys.dashboard.all, 'kpi'] as const,
    recentJobs: () => [...queryKeys.dashboard.all, 'recentJobs'] as const,
    alerts: () => [...queryKeys.dashboard.all, 'alerts'] as const,
  },
} as const;
