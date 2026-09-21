// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/api/ai.ts
// PURPOSE: AI API client including agent management and avatar upload/delete
// ============================================================================

import { apiClient } from './client';
import { AiCredential, AddCredentialRequest, Agent, CreateAgentRequest, UpdateAgentRequest } from '@/types';

export const aiApi = {
  getCredentials: async () => {
    const response = await apiClient.get<AiCredential[]>('/ai/credentials');
    return response.data;
  },

  addCredential: async (data: AddCredentialRequest) => {
    const response = await apiClient.post<AiCredential>('/ai/credentials', data);
    return response.data;
  },

  createAgent: async (data: CreateAgentRequest) => {
    const response = await apiClient.post<Agent>('/ai/agents', data);
    return response.data;
  },
  
  getAgents: async () => {
    const response = await apiClient.get<Agent[]>('/ai/agents');
    return response.data;
  },

  getAgent: async (id: string) => {
    const response = await apiClient.get<Agent>(`/ai/agents/${id}`);
    return response.data;
  },

  updateAgent: async (id: string, data: UpdateAgentRequest) => {
    const response = await apiClient.patch<Agent>(`/ai/agents/${id}`, data);
    return response.data;
  },

  deleteAgent: async (id: string) => {
    const response = await apiClient.delete<{ message: string }>(`/ai/agents/${id}`);
    return response.data;
  },

  /**
   * Uploads an avatar image for a specific AI agent owned by the user.
   */
  uploadAgentAvatar: async (id: string, file: File): Promise<Agent> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<Agent>(`/ai/agents/${id}/avatar`, formData);

    return response.data;
  },

  /**
   * Removes an AI agent's avatar.
   */
  deleteAgentAvatar: async (id: string): Promise<Agent> => {
    const response = await apiClient.delete<Agent>(`/ai/agents/${id}/avatar`);
    return response.data;
  },
};
