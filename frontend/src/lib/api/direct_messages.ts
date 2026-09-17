// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/api/direct_messages.ts
// PURPOSE: Direct Messages REST API client
// ============================================================================

import { apiClient } from './client';
import { Conversation, DirectMessage } from '@/types';

export const directMessagesApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get<Conversation[]>('/friends/conversations');
    return response.data;
  },

  getMessages: async (
    friendId: string,
    limit: number = 50,
    before?: string
  ): Promise<DirectMessage[]> => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    if (before) {
      params.set('before', before);
    }
    const response = await apiClient.get<DirectMessage[]>(
      `/friends/${friendId}/messages?${params.toString()}`
    );
    return response.data;
  },

  sendMessage: async (friendId: string, content: string): Promise<DirectMessage> => {
    const response = await apiClient.post<DirectMessage>(`/friends/${friendId}/messages`, {
      content,
    });
    return response.data;
  },
};