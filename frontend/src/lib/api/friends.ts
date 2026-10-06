import { apiClient } from './client';
import { UserInfo } from '../../types';
import { trackQuestAction } from '@/data/dailyQuests';

export interface FriendRequestPayload {
  username: string;
}

export interface FriendRequestResponse {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
}

export interface IncomingFriendRequest {
  id: string;
  sender: UserInfo;
  status: string;
  created_at: string;
}

export const friendsApi = {
  getFriends: async (): Promise<UserInfo[]> => {
    const response = await apiClient.get<UserInfo[]>('/friends');
    return response.data;
  },

  sendFriendRequest: async (payload: FriendRequestPayload): Promise<FriendRequestResponse> => {
    const response = await apiClient.post<FriendRequestResponse>('/friends/request', payload);
    trackQuestAction("social_interaction");
    return response.data;
  },

  getPendingRequests: async (): Promise<IncomingFriendRequest[]> => {
    const response = await apiClient.get<IncomingFriendRequest[]>('/friends/requests/pending');
    return response.data;
  },

  acceptRequest: async (requestId: string): Promise<void> => {
    await apiClient.post(`/friends/request/${requestId}/accept`);
    trackQuestAction("social_interaction");
  },

  rejectRequest: async (requestId: string): Promise<void> => {
    await apiClient.post(`/friends/request/${requestId}/reject`);
  },

  removeFriend: async (friendId: string): Promise<void> => {
    await apiClient.delete(`/friends/${friendId}`);
  },
};
