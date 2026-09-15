use async_trait::async_trait;

use crate::errors::AppError;
use crate::models::ai::Agent;

#[async_trait]
pub trait AiProvider: Send + Sync {
    /// Send a request to the AI provider with a system prompt and conversation history
    async fn generate_response(
        &self,
        agent: &Agent,
        system_prompt: &str,
        conversation_history: &[crate::models::message::Message],
        plaintext_key: &str,
    ) -> Result<String, AppError>;
}

/// A Mock AI provider for testing purposes without hitting real endpoints
pub struct MockProvider;

#[async_trait]
impl AiProvider for MockProvider {
    async fn generate_response(
        &self,
        _agent: &Agent,
        system_prompt: &str,
        conversation_history: &[crate::models::message::Message],
        _plaintext_key: &str,
    ) -> Result<String, AppError> {
        let last_message = conversation_history.last().map(|m| m.content.clone()).unwrap_or_default();
        Ok(format!("Mock response to '{}'. (Prompt length: {})", last_message, system_prompt.len()))
    }
}

pub fn get_provider(provider_name: &str) -> Box<dyn AiProvider> {
    match provider_name.to_lowercase().as_str() {
        "openai" => Box::new(crate::ai::openai::OpenAiProvider),
        "gemini" => Box::new(crate::ai::gemini::GeminiProvider),
        _ => Box::new(MockProvider), // Fallback
    }
}
