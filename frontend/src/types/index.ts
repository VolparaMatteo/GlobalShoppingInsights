// ---------------------------------------------------------------------------
// types/index.ts  --  Barrel re-export for all type modules
// ---------------------------------------------------------------------------

// API envelope types
export type { PaginatedResponse, ApiError, MessageResponse } from './api.types';

// Authentication
export type { LoginRequest, TokenResponse, RefreshRequest } from './auth.types';

// Users
export type { User, UserCreate, UserUpdate } from './user.types';

// Prompts
export type { Prompt, PromptCreate, PromptUpdate } from './prompt.types';

// Prompt Folders
export type { PromptFolder, PromptFolderCreate, PromptFolderUpdate } from './promptFolder.types';

// Search
export type { SearchRun, SearchResult } from './search.types';

// Articles
export type {
  Article,
  ArticleUpdate,
  PromptSummary,
  StatusChangeRequest,
  BatchActionRequest,
} from './article.types';

// Comments
export type { Comment, CommentCreate } from './comment.types';

// Revisions
export type { ArticleRevision, RevisionChange } from './revision.types';

// Taxonomy (Tags & Categories)
export type {
  Tag,
  TagCreate,
  TagUpdate,
  Category,
  CategoryCreate,
  CategoryUpdate,
} from './taxonomy.types';

// Editorial Calendar
export type {
  EditorialSlot,
  SlotCreate,
  SlotUpdate,
  CalendarRule,
  CalendarRuleUpdate,
  CollisionCheckRequest,
  CollisionCheckResponse,
} from './calendar.types';

// WordPress Integration
export type { WPConfig, WPConfigUpdate, WPPost } from './wordpress.types';

// Background Jobs
export type { JobLog } from './job.types';

// Notifications
export type { Notification } from './notification.types';

// Settings
export type {
  ScrapingSettings,
  DedupSettings,
  BlacklistEntry,
  BlacklistCreate,
} from './settings.types';

// Audit Logs
export type { AuditLog } from './audit.types';
