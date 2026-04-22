// ---------------------------------------------------------------------------
// user.types.ts  --  User domain types
// Mirrors: backend/app/schemas/user.py
// ---------------------------------------------------------------------------

/** Read-only representation returned by the API. */
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  last_login: string | null; // ISO-8601 datetime
  created_at: string; // ISO-8601 datetime
  updated_at: string; // ISO-8601 datetime
}

/** POST /users request body. */
export interface UserCreate {
  email: string;
  name: string;
  password: string;
  role?: string; // default "contributor"
}

/** PATCH /users/:id request body. All fields optional. */
export interface UserUpdate {
  email?: string | null;
  name?: string | null;
  password?: string | null;
  role?: string | null;
  is_active?: boolean | null;
}
