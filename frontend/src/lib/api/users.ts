// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/api/users.ts
// PURPOSE: User API client including profile updates and avatar upload/deletion
// ============================================================================

import { apiClient } from './client';
import { PublicUserProfile, UserInfo } from '@/types';

export const usersApi = {
  getUserProfile: async (id: string): Promise<PublicUserProfile> => {
    const response = await apiClient.get<PublicUserProfile>(`/users/${id}`);
    return response.data;
  },
  
  updateProfile: async (data: { display_name?: string; bio?: string; avatar_url?: string; banner_url?: string }): Promise<UserInfo> => {
    const response = await apiClient.patch<UserInfo>(`/users/me`, data);
    return response.data;
  },

  /**
   * Directly uploads an avatar image file for the current authenticated user.
   */
  uploadAvatar: async (file: File): Promise<UserInfo> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UserInfo>('/users/me/avatar', formData);
    return response.data;
  },

  /**
   * Clears/removes the current authenticated user's avatar.
   */
  deleteAvatar: async (): Promise<UserInfo> => {
    const response = await apiClient.delete<UserInfo>('/users/me/avatar');
    return response.data;
  },

  /**
   * Directly uploads a cover banner image file for the current authenticated user.
   */
  uploadBanner: async (file: File): Promise<UserInfo> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UserInfo>('/users/me/banner', formData);
    return response.data;
  },

  /**
   * Clears/removes the current authenticated user's cover banner.
   */
  deleteBanner: async (): Promise<UserInfo> => {
    const response = await apiClient.delete<UserInfo>('/users/me/banner');
    return response.data;
  },
};
