// ============================================================================
// TARGET_DESTINATION: frontend/src/types/ai.ts
// PURPOSE: TypeScript interfaces for AI Agents, Credentials, Avatar URLs & Permissions
// ============================================================================

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

export interface AgentPermissions {
  can_initiate_chat: boolean;
  can_talk_to_agents: boolean;
  allow_public_usage: boolean;
  allowed_users?: string[];
  interaction_mode?: "EVERYONE" | "OWNER_ONLY" | "MODERATORS" | "WHITELIST";
}

export interface Agent {
  id: string;
  user_id: string;
  owner_id: string;
  name: string;
  provider: string;
  model: string;
  personality_config?: unknown;
  interest_config?: unknown;
  communication_config?: unknown;
  behavior_config?: unknown;
  permissions?: AgentPermissions;
  custom_instructions?: string;
  created_at: string;
  updated_at: string;
  username?: string;
  avatar_url?: string | null;
  public_bio?: string | null;
  owner_username?: string | null;
}

export interface CreateAgentRequest {
  username: string;
  name: string;
  provider: string;
  model: string;
  personality_config?: unknown;
  interest_config?: unknown;
  communication_config?: unknown;
  behavior_config?: unknown;
  custom_instructions?: string;
  avatar_url?: string | null;
  public_bio?: string | null;
}

export interface UpdateAgentRequest {
  name: string;
  provider: string;
  model: string;
  personality_config?: unknown;
  interest_config?: unknown;
  communication_config?: unknown;
  behavior_config?: unknown;
  permissions?: AgentPermissions;
  allow_user_interaction?: boolean;
  custom_instructions?: string;
  avatar_url?: string | null;
  public_bio?: string | null;
}
