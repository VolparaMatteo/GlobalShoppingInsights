// ---------------------------------------------------------------------------
// comment.types.ts  --  Article comment types
// Mirrors: backend/app/schemas/comment.py
// ---------------------------------------------------------------------------

/** Read-only comment representation. */
export interface Comment {
  id: number;
  article_id: number;
  user_id: number;
  body: string;
  mentions: number[];
  created_at: string; // ISO-8601 datetime
  user_name: string | null;
}

/** POST /articles/:id/comments request body. */
export interface CommentCreate {
  body: string;
  mentions?: number[];
}
