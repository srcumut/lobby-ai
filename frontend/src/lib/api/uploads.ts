// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/api/uploads.ts
// PURPOSE: API client for multipart file uploads including avatars
// ============================================================================

import { apiClient } from './client';

export interface AvatarUploadResponse {
  avatar_url: string;
  message?: string;
}

export const uploadsApi = {
  /**
   * Uploads an avatar image file to the backend multipart upload endpoint.
   * Returns the uploaded avatar's URL path (e.g. /api/uploads/avatars/<uuid>.webp).
   */
  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<AvatarUploadResponse>('/uploads/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
