import { apiClient } from './client';
import { Lobby } from '@/types';

export interface CreateLobbyRequest {
  name: string;
  description?: string;
  is_private?: boolean;
  password?: string;
}

export interface JoinLobbyRequest {
  password?: string;
}

export interface LobbyMember {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  is_bot: boolean;
  joined_at: string;
}

export interface MessageSender {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface MessageResponse {
  id: string;
  lobby_id: string;
  sender: MessageSender;
  content: string;
  is_bot: boolean;
  created_at: string;
  updated_at?: string;
}

export const lobbiesApi = {
  getLobbies: async (): Promise<Lobby[]> => {
    const response = await apiClient.get<Lobby[]>('/lobbies');
    return response.data;
  },

  getLobbyById: async (id: string): Promise<Lobby> => {
    const response = await apiClient.get<Lobby>(`/lobbies/${id}`);
    return response.data;
  },

  createLobby: async (data: CreateLobbyRequest): Promise<Lobby> => {
    const response = await apiClient.post<Lobby>('/lobbies', data);
    return response.data;
  },

  joinLobby: async (id: string, data: JoinLobbyRequest): Promise<void> => {
    await apiClient.post(`/lobbies/${id}/join`, data);
  },

  leaveLobby: async (id: string): Promise<void> => {
    await apiClient.post(`/lobbies/${id}/leave`);
  },

  getMessages: async (id: string, limit: number = 50, before?: string): Promise<MessageResponse[]> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (before) params.append('before', before);
    
    const response = await apiClient.get<MessageResponse[]>(`/lobbies/${id}/messages?${params.toString()}`);
    return response.data;
  },

  moderateUser: async (lobbyId: string, action: 'kick' | 'mute' | 'unmute' | 'ban' | 'unban', userId: string, durationMinutes?: number | null): Promise<void> => {
    if (action === 'unmute') {
      await apiClient.delete(`/lobbies/${lobbyId}/moderation/mute/${userId}`);
      return;
    }
    if (action === 'unban') {
      await apiClient.delete(`/lobbies/${lobbyId}/moderation/ban/${userId}`);
      return;
    }
    const data = action === 'mute' ? { duration_minutes: durationMinutes === null ? null : (durationMinutes ?? 60) } : undefined;
    await apiClient.post(`/lobbies/${lobbyId}/moderation/${action}/${userId}`, data);
  },

  updateLobby: async (
    id: string, 
    payload: { name?: string; description?: string; theme?: string; icon?: string; announcement?: string | null } | string,
    legacyDescription?: string
  ): Promise<Lobby> => {
    const data = typeof payload === "string" 
      ? { name: payload, description: legacyDescription }
      : payload;
    const response = await apiClient.put<Lobby>(`/lobbies/${id}`, data);
    return response.data;
  },

  getMembers: async (id: string): Promise<import('../../types').LobbyMember[]> => {
    const response = await apiClient.get<import('../../types').LobbyMember[]>(`/lobbies/${id}/members`);
    return response.data;
  },

  getBans: async (id: string): Promise<import('../../types').BannedUser[]> => {
    const response = await apiClient.get<import('../../types').BannedUser[]>(`/lobbies/${id}/bans`);
    return response.data;
  },

  addBotToLobby: async (lobbyId: string, botUserId: string) => {
    const response = await apiClient.post(`/lobbies/${lobbyId}/bots`, { bot_user_id: botUserId });
    return response.data;
  },

  setMemberRole: async (lobbyId: string, userId: string, role: string): Promise<void> => {
    await apiClient.post(`/lobbies/${lobbyId}/moderation/role/${userId}`, { role });
  },

  updateNotificationPreference: async (lobbyId: string, preference: "ALL" | "MENTIONS_ONLY" | "MUTE"): Promise<void> => {
    await apiClient.put(`/lobbies/${lobbyId}/notifications`, { preference });
  },

  getJoinRequests: async (lobbyId: string): Promise<import('../../types').JoinRequest[]> => {
    const response = await apiClient.get<import('../../types').JoinRequest[]>(`/lobbies/${lobbyId}/requests`);
    return response.data;
  },

  approveJoinRequest: async (lobbyId: string, userId: string): Promise<void> => {
    await apiClient.post(`/lobbies/${lobbyId}/requests/${userId}/approve`);
  },

  rejectJoinRequest: async (lobbyId: string, userId: string): Promise<void> => {
    await apiClient.post(`/lobbies/${lobbyId}/requests/${userId}/reject`);
  },

  inviteUser: async (lobbyId: string, payload: { username?: string; user_id?: string }): Promise<void> => {
    await apiClient.post(`/lobbies/${lobbyId}/invites`, payload);
  },

  sendMessage: async (id: string, content: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/lobbies/${id}/messages`, { content });
    return response.data;
  },

  updateMessage: async (lobbyId: string, messageId: string, content: string): Promise<MessageResponse> => {
    const response = await apiClient.put<MessageResponse>(`/lobbies/${lobbyId}/messages/${messageId}`, { content });
    return response.data;
  },

  deleteMessage: async (lobbyId: string, messageId: string): Promise<void> => {
    await apiClient.delete(`/lobbies/${lobbyId}/messages/${messageId}`);
  },

  initiateAgentChat: async (lobbyId: string, agentId: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/lobbies/${lobbyId}/agents/${agentId}/initiate`);
    return response.data;
  },
};
