import { apiClient } from './client';
import { PublicUserProfile } from '../../types';

export const usersApi = {
  getUserProfile: async (id: string): Promise<PublicUserProfile> => {
    const response = await apiClient.get<PublicUserProfile>(`/users/${id}`);
    return response.data;
  },
  
  updateProfile: async (data: { display_name?: string; bio?: string; avatar_url?: string }): Promise<any> => {
    const response = await apiClient.patch(`/users/me`, data);
    return response.data;
  },
};
