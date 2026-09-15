export interface AiCredential {
  id: string;
  user_id: string;
  provider: string;
  created_at: string;
}

export interface AddCredentialRequest {
  provider: string;
  api_key: string;
}

export interface Agent {
  id: string;
  user_id: string;
  owner_id: string;
  name: string;
  provider: string;
  model: string;
  personality_config?: any;
  interest_config?: any;
  communication_config?: any;
  behavior_config?: any;
  custom_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentRequest {
  username: string;
  name: string;
  provider: string;
  model: string;
  personality_config?: any;
  interest_config?: any;
  communication_config?: any;
  behavior_config?: any;
  custom_instructions?: string;
}
