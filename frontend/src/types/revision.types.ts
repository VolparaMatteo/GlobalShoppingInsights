// ---------------------------------------------------------------------------
// revision.types.ts  --  Article revision (version history) types
// Mirrors: backend/app/schemas/article.py  (RevisionResponse)
// ---------------------------------------------------------------------------

/** Single field-level change inside a revision. */
export interface RevisionChange {
  field: string;
  old_value: unknown;
  new_value: unknown;
}

/** One revision entry for an article. */
export interface ArticleRevision {
  id: number;
  article_id: number;
  version: number;
  editor_id: number;
  changes: RevisionChange[];
  created_at: string; // ISO-8601 datetime
}
