// ---------------------------------------------------------------------------
// services/api/client.ts  --  Axios instance with JWT interceptors
// ---------------------------------------------------------------------------
import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// ---- Request interceptor: attach Bearer token ----------------------------

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response interceptor: handle 401 & silent refresh -------------------

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401 and if we haven't already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const { refreshToken, setTokens, logout } = useAuthStore.getState();

    // No refresh token available -- force logout
    if (!refreshToken) {
      logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return client(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Direct axios call to avoid interceptor loop
      const { data } = await axios.post(
        `${client.defaults.baseURL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );

      const newAccessToken: string = data.access_token;
      const newRefreshToken: string = data.refresh_token;

      setTokens(newAccessToken, newRefreshToken);
      processQueue(null, newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return client(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default client;
