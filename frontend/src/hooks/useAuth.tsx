"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserInfo } from '@/types';
import { authApi } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshTokenOrUser: string | UserInfo, maybeUserData?: UserInfo) => void;
  updateUser: (userData: UserInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedRefreshToken = localStorage.getItem('refresh_token');

      if (storedToken) {
        setToken(storedToken);
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error("Failed to fetch current user, attempting refresh...", error);
          if (storedRefreshToken) {
            try {
              const refreshData = await authApi.refreshToken(storedRefreshToken);
              localStorage.setItem('access_token', refreshData.access_token);
              if (refreshData.refresh_token) {
                localStorage.setItem('refresh_token', refreshData.refresh_token);
              }
              setToken(refreshData.access_token);
              setUser(refreshData.user);
            } catch (refErr) {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
              setToken(null);
              setUser(null);
            }
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
      } else if (storedRefreshToken) {
        // We have a refresh token but no access token
        try {
          const refreshData = await authApi.refreshToken(storedRefreshToken);
          localStorage.setItem('access_token', refreshData.access_token);
          if (refreshData.refresh_token) {
            localStorage.setItem('refresh_token', refreshData.refresh_token);
          }
          setToken(refreshData.access_token);
          setUser(refreshData.user);
        } catch (refErr) {
          localStorage.removeItem('refresh_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for custom token refreshed events dispatched by the apiClient interceptor
    const handleTokenRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent<{ token: string; refreshToken?: string; user?: UserInfo }>;
      if (customEvent.detail) {
        if (customEvent.detail.token) {
          setToken(customEvent.detail.token);
        }
        if (customEvent.detail.user) {
          setUser(customEvent.detail.user);
        }
      }
    };

    const handleLoggedOut = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth:logged-out', handleLoggedOut);

    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth:logged-out', handleLoggedOut);
    };
  }, []);

  const login = (newToken: string, refreshTokenOrUser: string | UserInfo, maybeUserData?: UserInfo) => {
    let refreshToken: string | null = null;
    let userData: UserInfo;

    if (maybeUserData !== undefined) {
      refreshToken = refreshTokenOrUser as string;
      userData = maybeUserData;
    } else {
      userData = refreshTokenOrUser as UserInfo;
      refreshToken = localStorage.getItem('refresh_token');
    }

    localStorage.setItem('access_token', newToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(newToken);
    setUser(userData);
  };

  const updateUser = (userData: UserInfo) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
