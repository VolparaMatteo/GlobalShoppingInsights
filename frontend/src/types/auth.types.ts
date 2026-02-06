// ---------------------------------------------------------------------------
// auth.types.ts  --  Authentication request / response types
// Mirrors: backend/app/schemas/auth.py
// ---------------------------------------------------------------------------

/** POST /auth/login request body. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /auth/login & /auth/refresh response body. */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string; // default "bearer"
}

/** POST /auth/refresh request body. */
export interface RefreshRequest {
  refresh_token: string;
}
