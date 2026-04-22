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
  avatar_url: string | null;
  last_login: string | null; // ISO-8601 datetime
  created_at: string; // ISO-8601 datetime
  updated_at: string; // ISO-8601 datetime
}

/** PATCH /users/me request body (self-service). */
export interface UserSelfUpdate {
  name?: string | null;
  email?: string | null;
  current_password?: string | null;
  new_password?: string | null;
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
