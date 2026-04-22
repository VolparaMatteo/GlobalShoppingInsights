// ---------------------------------------------------------------------------
// prompt.types.ts  --  Search-prompt domain types
// Mirrors: backend/app/schemas/prompt.py
// ---------------------------------------------------------------------------

/** Read-only prompt representation returned by the API. */
export interface Prompt {
  id: number;
  title: string;
  description: string | null;
  keywords: string[];
  excluded_keywords: string[];
  language: string | null;
  countries: string[];
  time_depth: string;
  max_results: number;
  schedule_enabled: boolean;
  schedule_frequency_hours: number | null;
  schedule_specific_times: string[] | null;
  schedule_next_run_at: string | null; // ISO-8601 datetime
  last_run_at: string | null; // ISO-8601 datetime
  is_active: boolean;
  folder_id: number | null;
  folder_name: string | null;
  created_by: number | null;
  created_at: string; // ISO-8601 datetime
  updated_at: string; // ISO-8601 datetime
}

/** POST /prompts request body. */
export interface PromptCreate {
  title: string;
  description?: string | null;
  keywords?: string[];
  excluded_keywords?: string[];
  language?: string | null;
  countries?: string[];
  time_depth?: string; // default "7d"
  max_results?: number; // default 20
  schedule_enabled?: boolean; // default false
  schedule_frequency_hours?: number | null;
  schedule_specific_times?: string[] | null;
  folder_id?: number | null;
}

/** PATCH /prompts/:id request body. All fields optional. */
export interface PromptUpdate {
  title?: string | null;
  description?: string | null;
  keywords?: string[] | null;
  excluded_keywords?: string[] | null;
  language?: string | null;
  countries?: string[] | null;
  time_depth?: string | null;
  max_results?: number | null;
  schedule_enabled?: boolean | null;
  schedule_frequency_hours?: number | null;
  schedule_specific_times?: string[] | null;
  is_active?: boolean | null;
  folder_id?: number | null;
}
