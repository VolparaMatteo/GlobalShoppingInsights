// ---------------------------------------------------------------------------
// taxonomy.types.ts  --  Tag & Category types
// Mirrors: backend/app/schemas/taxonomy.py
// ---------------------------------------------------------------------------

// ---- Tags ----------------------------------------------------------------

/** Read-only tag. */
export interface Tag {
  id: number;
  name: string;
  slug: string;
  wp_id: number | null;
  created_at: string | null; // ISO-8601 datetime
}

/** POST /tags request body. */
export interface TagCreate {
  name: string;
  slug?: string | null;
}

/** PATCH /tags/:id request body. */
export interface TagUpdate {
  name?: string | null;
  slug?: string | null;
}

// ---- Categories ----------------------------------------------------------

/** Read-only category. */
export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  wp_id: number | null;
  created_at: string | null; // ISO-8601 datetime
}

/** POST /categories request body. */
export interface CategoryCreate {
  name: string;
  slug?: string | null;
  parent_id?: number | null;
}

/** PATCH /categories/:id request body. */
export interface CategoryUpdate {
  name?: string | null;
  slug?: string | null;
  parent_id?: number | null;
}
