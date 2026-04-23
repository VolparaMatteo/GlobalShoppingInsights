// ---------------------------------------------------------------------------
// i18n/locales/en.ts — secondary language
// Mirror delle chiavi di it.ts — stessa struttura, traduzioni in English.
// ---------------------------------------------------------------------------

export default {
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    retry: 'Retry',
    back: 'Back',
    next: 'Next',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    yes: 'Yes',
    no: 'No',
    all: 'All',
    none: 'None',
    empty: 'No data available',
  },

  nav: {
    dashboard: 'Dashboard',
    alerts: 'Alerts & Job Log',
    prompts: 'Prompts',
    inbox: 'Inbox',
    calendar: 'Calendar',
    taxonomy: 'Taxonomy',
    settings: 'Settings',
    skipToContent: 'Skip to content',
  },

  auth: {
    loginTitle: 'Sign in to GSI',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    logout: 'Log out',
    profile: 'My profile',
    changePassword: 'Change password',
    sessionExpired: 'Session expired. Please sign in again.',
  },

  theme: {
    light: 'Light theme',
    dark: 'Dark theme',
    toggleLight: 'Switch to light theme',
    toggleDark: 'Switch to dark theme',
  },

  status: {
    imported: 'Imported',
    screened: 'Screened',
    in_review: 'In Review',
    approved: 'Approved',
    scheduled: 'Scheduled',
    publishing: 'Publishing',
    published: 'Published',
    publish_failed: 'Publish Failed',
    rejected: 'Rejected',
  },

  role: {
    admin: 'Administrator',
    reviewer: 'Reviewer',
    editor: 'Editor',
    contributor: 'Contributor',
    read_only: 'Read Only',
  },

  dashboard: {
    greeting_morning: 'Good morning',
    greeting_afternoon: 'Good afternoon',
    greeting_evening: 'Good evening',
    subtitle: 'Here is your editorial pipeline status today.',
    kpi: {
      total: 'Total Articles',
      new_week: 'New This Week',
      in_review: 'In Review',
      scheduled: 'Scheduled',
      published: 'Published',
      ai_score: 'Avg AI Score',
    },
    pipeline_title: 'Editorial Pipeline',
    distribution_title: 'Article distribution in workflow',
    distribution_subtitle: 'Number of articles in each pipeline state',
  },

  inbox: {
    title: 'Inbox',
    searchPlaceholder: 'Search by title or content...',
    filters: 'Filters',
    batch: 'Batch operations',
    preview: 'Preview',
    empty: 'No articles found',
    emptyFiltered: 'No articles match the selected filters',
  },

  commandPalette: {
    placeholder: 'Search articles, prompts, users, or actions…',
    empty: 'No results for "{{query}}"',
    navigate: 'Navigate',
    actions: 'Quick actions',
    articles: 'Articles',
    prompts: 'Prompts',
  },

  errors: {
    generic: 'Something went wrong. Please try again.',
    network: 'Cannot reach the server. Check your connection.',
    timeout: 'Timeout: the server did not respond in time.',
    forbidden: 'You do not have permission to perform this action.',
    notFound: 'Resource not found.',
    rateLimit: 'Too many requests in a short time. Please wait.',
    server: 'Server error. If this persists, contact the administrator.',
  },

  llm: {
    bannerTitle: 'LLM (Ollama) temporarily offline',
    bannerDescription:
      'The AI relevance-check service registered {{failures}} consecutive failures and has been suspended. The pipeline continues using embeddings only.',
    bannerHalfOpen: 'LLM (Ollama) attempting restart',
  },
} as const;
