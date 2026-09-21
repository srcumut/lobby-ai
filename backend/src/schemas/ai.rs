use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct AddCredentialRequest {
    #[validate(length(min = 1, message = "Provider is required"))]
    pub provider: String,
    
    #[validate(length(min = 1, message = "API key is required"))]
    pub api_key: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AgentPermissionsInput {
    pub can_initiate_chat: Option<bool>,
    pub can_talk_to_agents: Option<bool>,
    pub allow_public_usage: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateAgentRequest {
    #[validate(length(min = 3, max = 32, message = "Agent username must be between 3 and 32 characters"))]
    pub username: String, // Maps to User.username for the mention system (@username)
    
    #[validate(length(min = 1, max = 64, message = "Agent name must be between 1 and 64 characters"))]
    pub name: String,     // Maps to User.display_name and Agent.name
    
    #[validate(length(min = 1, message = "Provider is required"))]
    pub provider: String,
    
    #[validate(length(min = 1, message = "Model is required"))]
    pub model: String,
    
    // Optional personality configs
    pub personality_config: Option<serde_json::Value>,
    pub interest_config: Option<serde_json::Value>,
    pub communication_config: Option<serde_json::Value>,
    pub behavior_config: Option<serde_json::Value>,
    
    #[validate(length(max = 2000, message = "Custom instructions must be at most 2000 characters"))]
    pub custom_instructions: Option<String>,

    pub can_initiate_conversation: Option<bool>,
    pub can_chat_with_agents: Option<bool>,
    pub allow_user_interaction: Option<bool>,
    pub permissions: Option<AgentPermissionsInput>,

    pub avatar_url: Option<String>,
    pub public_bio: Option<String>,
}

impl CreateAgentRequest {
    pub fn resolved_can_initiate(&self) -> bool {
        self.can_initiate_conversation
            .or_else(|| self.permissions.as_ref().and_then(|p| p.can_initiate_chat))
            .unwrap_or(false)
    }

    pub fn resolved_can_chat_with_agents(&self) -> bool {
        self.can_chat_with_agents
            .or_else(|| self.permissions.as_ref().and_then(|p| p.can_talk_to_agents))
            .unwrap_or(false)
    }

    pub fn resolved_allow_user_interaction(&self) -> bool {
        self.allow_user_interaction
            .or_else(|| self.permissions.as_ref().and_then(|p| p.allow_public_usage))
            .unwrap_or(true)
    }
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateAgentRequest {
    #[validate(length(min = 1, max = 64, message = "Agent name must be between 1 and 64 characters"))]
    pub name: String,
    
    #[validate(length(min = 1, message = "Provider is required"))]
    pub provider: String,
    
    #[validate(length(min = 1, message = "Model is required"))]
    pub model: String,
    
    pub personality_config: Option<serde_json::Value>,
    pub interest_config: Option<serde_json::Value>,
    pub communication_config: Option<serde_json::Value>,
    pub behavior_config: Option<serde_json::Value>,
    
    #[validate(length(max = 2000, message = "Custom instructions must be at most 2000 characters"))]
    pub custom_instructions: Option<String>,

    pub can_initiate_conversation: Option<bool>,
    pub can_chat_with_agents: Option<bool>,
    pub allow_user_interaction: Option<bool>,
    pub permissions: Option<AgentPermissionsInput>,

    pub avatar_url: Option<String>,
    pub public_bio: Option<String>,
}

impl UpdateAgentRequest {
    pub fn resolved_can_initiate(&self) -> Option<bool> {
        self.can_initiate_conversation
            .or_else(|| self.permissions.as_ref().and_then(|p| p.can_initiate_chat))
    }

    pub fn resolved_can_chat_with_agents(&self) -> Option<bool> {
        self.can_chat_with_agents
            .or_else(|| self.permissions.as_ref().and_then(|p| p.can_talk_to_agents))
    }

    pub fn resolved_allow_user_interaction(&self) -> Option<bool> {
        self.allow_user_interaction
            .or_else(|| self.permissions.as_ref().and_then(|p| p.allow_public_usage))
    }
}

#[derive(Debug, Deserialize, Validate)]
pub struct TestAgentRequest {
    #[validate(length(min = 1, message = "Message is required"))]
    pub message: String,
}
