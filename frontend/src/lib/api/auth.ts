import { apiClient } from './client';
import { AuthResponse, UserInfo } from '@/types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (username: string, email: string, password: string, display_name?: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', { 
      username, 
      email, 
      password,
      display_name 
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<UserInfo> => {
    const response = await apiClient.get<UserInfo>('/users/me');
    return response.data;
  },
};
