use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct AddCredentialRequest {
    #[validate(length(min = 1, message = "Provider is required"))]
    pub provider: String,
    
    #[validate(length(min = 1, message = "API key is required"))]
    pub api_key: String,
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

    pub avatar_url: Option<String>,
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

    pub avatar_url: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct TestAgentRequest {
    #[validate(length(min = 1, message = "Message is required"))]
    pub message: String,
}
