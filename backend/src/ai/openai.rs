use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::time::Duration;
use tracing::error;

use crate::ai::provider::AiProvider;
use crate::errors::AppError;
use crate::models::ai::Agent;

#[derive(Serialize)]
struct OpenAiMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct OpenAiRequest {
    model: String,
    messages: Vec<OpenAiMessage>,
}

#[derive(Deserialize)]
struct OpenAiChoice {
    message: OpenAiResponseMessage,
}

#[derive(Deserialize)]
struct OpenAiResponseMessage {
    content: Option<String>,
}

#[derive(Deserialize)]
struct OpenAiResponse {
    choices: Vec<OpenAiChoice>,
}

pub struct OpenAiProvider;

#[async_trait]
impl AiProvider for OpenAiProvider {
    async fn generate_response(
        &self,
        agent: &Agent,
        system_prompt: &str,
        conversation_history: &[crate::models::message::Message],
        plaintext_key: &str,
    ) -> Result<String, AppError> {
        let mut messages = vec![OpenAiMessage {
            role: "system".to_string(),
            content: system_prompt.to_string(),
        }];

        for msg in conversation_history {
            let role = if msg.sender_id == agent.user_id {
                "assistant"
            } else {
                "user"
            };
            messages.push(OpenAiMessage {
                role: role.to_string(),
                content: msg.content.clone(),
            });
        }

        let model = if !agent.model.is_empty() {
            agent.model.clone()
        } else {
            "gpt-4o-mini".to_string()
        };

        let req_body = OpenAiRequest {
            model,
            messages,
        };

        let client = Client::builder()
            .timeout(Duration::from_secs(60))
            .build()
            .map_err(|e| AppError::Internal(format!("Failed to build reqwest client: {}", e)))?;

        let mut attempts = 0;
        let max_attempts = 3;
        let mut last_error_msg = String::new();

        while attempts < max_attempts {
            attempts += 1;

            let res = client
                .post("https://api.openai.com/v1/chat/completions")
                .header("Authorization", format!("Bearer {}", plaintext_key))
                .header("Content-Type", "application/json")
                .json(&req_body)
                .send()
                .await;

            match res {
                Ok(response) => {
                    let status = response.status();
                    if status.is_success() {
                        let ai_resp: OpenAiResponse = response
                            .json()
                            .await
                            .map_err(|e| AppError::Internal(format!("Failed to parse OpenAI response: {}", e)))?;

                        if let Some(choice) = ai_resp.choices.first() {
                            if let Some(content) = &choice.message.content {
                                return Ok(content.clone());
                            }
                        }

                        return Err(AppError::Internal("No content returned from OpenAI".to_string()));
                    }

                    let status_code = status.as_u16();
                    let error_text = response.text().await.unwrap_or_default();
                    error!(
                        "OpenAI API error (attempt {}/{}): {} - {}",
                        attempts, max_attempts, status, error_text
                    );
                    last_error_msg = format!("OpenAI API error: {} - {}", status, error_text);

                    // 503 Service Unavailable, 429 Too Many Requests, or 5xx server errors warrant retry
                    if (status_code == 503 || status_code == 429 || status.is_server_error()) && attempts < max_attempts {
                        let backoff_secs = attempts;
                        tracing::warn!("Retrying OpenAI API call in {}s due to {}...", backoff_secs, status);
                        tokio::time::sleep(Duration::from_secs(backoff_secs as u64)).await;
                        continue;
                    }

                    return Err(AppError::Internal(last_error_msg));
                }
                Err(e) => {
                    error!(
                        "OpenAI request failed (attempt {}/{}): {}",
                        attempts, max_attempts, e
                    );
                    last_error_msg = format!("OpenAI request failed: {}", e);
                    if attempts < max_attempts {
                        let backoff_secs = attempts;
                        tokio::time::sleep(Duration::from_secs(backoff_secs as u64)).await;
                        continue;
                    }
                }
            }
        }

        Err(AppError::Internal(last_error_msg))
    }
}
