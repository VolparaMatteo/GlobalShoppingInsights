// ---------------------------------------------------------------------------
// promptFolder.types.ts  --  Prompt folder domain types
// Mirrors: backend/app/schemas/prompt_folder.py
// ---------------------------------------------------------------------------

/** Read-only folder representation returned by the API. */
export interface PromptFolder {
  id: number;
  name: string;
  parent_id: number | null;
  prompt_count: number;
  children: PromptFolder[];
  created_at: string; // ISO-8601 datetime
}

/** POST /prompt-folders request body. */
export interface PromptFolderCreate {
  name: string;
  parent_id?: number | null;
}

/** PATCH /prompt-folders/:id request body. */
export interface PromptFolderUpdate {
  name?: string;
  parent_id?: number | null;
}
