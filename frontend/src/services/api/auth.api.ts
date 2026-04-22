// ---------------------------------------------------------------------------
// services/api/auth.api.ts  --  Authentication endpoints
// ---------------------------------------------------------------------------
import client from './client';
import type { LoginRequest, TokenResponse, User } from '@/types';

/** POST /auth/login */
export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const { data } = await client.post<TokenResponse>('/auth/login', payload);
  return data;
}

/** POST /auth/refresh */
export async function refresh(refreshToken: string): Promise<TokenResponse> {
  const { data } = await client.post<TokenResponse>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  return data;
}

/** GET /auth/me */
export async function getMe(): Promise<User> {
  const { data } = await client.get<User>('/auth/me');
  return data;
}
