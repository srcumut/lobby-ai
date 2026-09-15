import { apiClient } from './client';
import { AiCredential, AddCredentialRequest, Agent, CreateAgentRequest } from '@/types';

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
};
