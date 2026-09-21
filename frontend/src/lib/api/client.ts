import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse } from '@/types';

// Backend is running on port 8080 by default (from docker-compose / technical-spec)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach access token if it exists
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Client-side only
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Critical: If sending FormData, remove Content-Type so browser calculates boundary automatically
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency lock and queue for token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor to handle 401 Unauthorized with automatic JWT token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // If no response or status is not 401, reject immediately
    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';

    // If the 401 occurred on auth endpoints (login, register, refresh), do not attempt refresh
    if (
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    // If this request was already retried and still got 401, stop to prevent infinite loop
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Check if we have a refresh token
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (!refreshToken) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Use raw axios to bypass interceptors and avoid recursive loops
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { access_token, refresh_token: newRefreshToken, user } = response.data;

      // Update storage with new tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', access_token);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Notify React context of the refreshed token
        window.dispatchEvent(
          new CustomEvent('auth:token-refreshed', {
            detail: { token: access_token, refreshToken: newRefreshToken, user },
          })
        );
      }

      // Update authorization header on the original request
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
      }

      // Process queued requests
      processQueue(null, access_token);

      // Retry the original request
      return apiClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);

      // Refresh token is expired or invalid -> log out
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logged-out'));

        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
