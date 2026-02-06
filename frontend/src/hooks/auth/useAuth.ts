import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { login as loginApi, getMe } from '@/services/api/auth.api';
import { ROUTES } from '@/config/routes';

export function useAuth() {
  const navigate = useNavigate();
  const { setTokens, setUser, logout: storeLogout } = useAuthStore();

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await loginApi({ email, password });
    setTokens(tokens.access_token, tokens.refresh_token);
    const user = await getMe();
    setUser(user);
    navigate(ROUTES.DASHBOARD);
  }, [navigate, setTokens, setUser]);

  const logout = useCallback(() => {
    storeLogout();
    navigate(ROUTES.LOGIN);
  }, [navigate, storeLogout]);

  return { login, logout };
}
