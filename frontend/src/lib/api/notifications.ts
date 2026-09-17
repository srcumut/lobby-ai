import { apiClient } from './client';
import { NotificationResponse } from '@/types';

export const notificationsApi = {
  getNotifications: async (): Promise<NotificationResponse[]> => {
    const response = await apiClient.get<NotificationResponse[]>('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>('/notifications/read-all');
    return response.data;
  },
};
