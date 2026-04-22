// ---------------------------------------------------------------------------
// Global Shopping Insights - Application Constants
// ---------------------------------------------------------------------------

/** Possible article workflow statuses with associated display metadata. */
export const STATUS_MAP = {
  imported: { label: 'Importato', color: '#8c8c8c', bgColor: '#f5f5f5' },
  screened: { label: 'Vagliato', color: '#1890ff', bgColor: '#e6f7ff' },
  in_review: { label: 'In Revisione', color: '#faad14', bgColor: '#fffbe6' },
  approved: { label: 'Approvato', color: '#52c41a', bgColor: '#f6ffed' },
  scheduled: { label: 'Pianificato', color: '#722ed1', bgColor: '#f9f0ff' },
  publishing: { label: 'In Pubblicazione', color: '#13c2c2', bgColor: '#e6fffb' },
  published: { label: 'Pubblicato', color: '#389e0d', bgColor: '#f6ffed' },
  publish_failed: { label: 'Pubblicazione Fallita', color: '#ff4d4f', bgColor: '#fff2f0' },
  rejected: { label: 'Rifiutato', color: '#cf1322', bgColor: '#fff1f0' },
} as const;

export type ArticleStatus = keyof typeof STATUS_MAP;

/** All article statuses as an ordered array (follows the workflow progression). */
export const ARTICLE_STATUSES: ArticleStatus[] = [
  'imported',
  'screened',
  'in_review',
  'approved',
  'scheduled',
  'publishing',
  'published',
  'publish_failed',
  'rejected',
];

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export const ROLES = ['admin', 'editor', 'reviewer', 'contributor', 'read_only'] as const;

export type Role = (typeof ROLES)[number];

/** Human-readable labels for each role. */
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Amministratore',
  editor: 'Editore',
  reviewer: 'Revisore',
  contributor: 'Collaboratore',
  read_only: 'Sola Lettura',
};

// ---------------------------------------------------------------------------
// Calendar / Scheduling
// ---------------------------------------------------------------------------

/** Available publishing slot hours (24-h format). */
export const SLOT_TIMES: number[] = [
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
];

/** Default slot hours suggested by the RPD (09:00, 13:00, 18:00). */
export const DEFAULT_SLOT_HOURS: number[] = [9, 13, 18];

// ---------------------------------------------------------------------------
// Prompt / Search
// ---------------------------------------------------------------------------

export interface TimeDepthOption {
  value: string;
  label: string;
}

/** Temporal depth options for prompt-based discovery searches. */
export const TIME_DEPTH_OPTIONS: TimeDepthOption[] = [
  { value: '24h', label: 'Ultime 24 ore' },
  { value: '7d', label: 'Ultimi 7 giorni' },
  { value: '30d', label: 'Ultimi 30 giorni' },
  { value: '90d', label: 'Ultimi 90 giorni' },
  { value: '365d', label: 'Ultimo anno' },
  { value: 'all', label: 'Tutto il periodo' },
];

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/** AI relevance score thresholds used for visual indicators. */
export const SCORE_THRESHOLDS = {
  high: 75,
  medium: 50,
  low: 25,
} as const;
