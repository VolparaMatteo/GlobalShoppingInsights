// ---------------------------------------------------------------------------
// Global Shopping Insights - Role-Permission Matrix (RBAC)
// ---------------------------------------------------------------------------
// Derived from RPD Section 3 - Personas, ruoli e permessi.
// ---------------------------------------------------------------------------

import type { Role } from './constants';

/**
 * Every granular action the UI needs to gate.
 * Backend must enforce the same rules; this matrix is for client-side UX only.
 */
export type Permission =
  // Dashboard
  | 'dashboard:view'
  // Articles
  | 'article:view'
  | 'article:create'
  | 'article:edit'
  | 'article:delete'
  | 'article:tag'
  | 'article:comment'
  | 'article:assign'
  | 'article:discard'
  | 'article:merge_duplicate'
  | 'article:submit_for_review'
  | 'article:approve'
  | 'article:reject'
  | 'article:schedule'
  | 'article:publish_now'
  | 'article:retry_publish'
  // Prompts
  | 'prompt:view'
  | 'prompt:create'
  | 'prompt:edit'
  | 'prompt:delete'
  | 'prompt:run'
  | 'prompt:schedule'
  // Calendar
  | 'calendar:view'
  | 'calendar:manage_slots'
  // Taxonomy
  | 'taxonomy:view'
  | 'taxonomy:manage'
  // Users
  | 'user:view'
  | 'user:manage'
  // Settings / Admin
  | 'settings:view'
  | 'settings:manage_wordpress'
  | 'settings:manage_blacklist'
  | 'settings:manage_integrations';

/**
 * The matrix maps each role to the set of permissions it grants.
 *
 * Rules from RPD:
 *  - Admin: full access, manage users/roles, WP settings, override workflow.
 *  - Editor: CRUD articles, tag, comment, schedule, propose publication.
 *  - Reviewer: approve/reject, final edit, validate duplicates.
 *  - Contributor: import, comment, propose tags, create drafts (no publish).
 *  - Read-only: view dashboard and articles, no modifications.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    'dashboard:view',
    'article:view',
    'article:create',
    'article:edit',
    'article:delete',
    'article:tag',
    'article:comment',
    'article:assign',
    'article:discard',
    'article:merge_duplicate',
    'article:submit_for_review',
    'article:approve',
    'article:reject',
    'article:schedule',
    'article:publish_now',
    'article:retry_publish',
    'prompt:view',
    'prompt:create',
    'prompt:edit',
    'prompt:delete',
    'prompt:run',
    'prompt:schedule',
    'calendar:view',
    'calendar:manage_slots',
    'taxonomy:view',
    'taxonomy:manage',
    'user:view',
    'user:manage',
    'settings:view',
    'settings:manage_wordpress',
    'settings:manage_blacklist',
    'settings:manage_integrations',
  ],

  editor: [
    'dashboard:view',
    'article:view',
    'article:create',
    'article:edit',
    'article:tag',
    'article:comment',
    'article:assign',
    'article:discard',
    'article:submit_for_review',
    'article:schedule',
    'article:retry_publish',
    'prompt:view',
    'prompt:create',
    'prompt:edit',
    'prompt:run',
    'prompt:schedule',
    'calendar:view',
    'calendar:manage_slots',
    'taxonomy:view',
    'taxonomy:manage',
  ],

  reviewer: [
    'dashboard:view',
    'article:view',
    'article:edit',
    'article:tag',
    'article:comment',
    'article:merge_duplicate',
    'article:approve',
    'article:reject',
    'article:schedule',
    'article:retry_publish',
    'prompt:view',
    'prompt:run',
    'calendar:view',
    'calendar:manage_slots',
    'taxonomy:view',
  ],

  contributor: [
    'dashboard:view',
    'article:view',
    'article:create',
    'article:tag',
    'article:comment',
    'prompt:view',
    'prompt:create',
    'prompt:run',
    'calendar:view',
    'taxonomy:view',
  ],

  read_only: ['dashboard:view', 'article:view', 'prompt:view', 'calendar:view', 'taxonomy:view'],
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check whether a given role has a specific permission. */
export function hasPermission(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly Permission[]).includes(permission);
}

/** Check whether a given role has *all* of the listed permissions. */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/** Check whether a given role has *at least one* of the listed permissions. */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
