use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::time::Duration;
use tracing::error;

use crate::ai::provider::AiProvider;
use crate::errors::AppError;
use crate::models::ai::Agent;

#[derive(Serialize)]
struct GeminiPart {
    text: String,
}

#[derive(Serialize)]
struct GeminiContent {
    role: String,
    parts: Vec<GeminiPart>,
}

#[derive(Serialize)]
struct GeminiSystemInstruction {
    parts: Vec<GeminiPart>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
    system_instruction: Option<GeminiSystemInstruction>,
}

#[derive(Deserialize)]
struct GeminiCandidate {
    content: GeminiCandidateContent,
}

#[derive(Deserialize)]
struct GeminiCandidateContent {
    parts: Vec<GeminiCandidatePart>,
}

#[derive(Deserialize)]
struct GeminiCandidatePart {
    text: String,
}

#[derive(Deserialize)]
struct GeminiResponse {
    candidates: Option<Vec<GeminiCandidate>>,
}

pub struct GeminiProvider;

#[async_trait]
impl AiProvider for GeminiProvider {
    async fn generate_response(
        &self,
        agent: &Agent,
        system_prompt: &str,
        conversation_history: &[crate::models::message::Message],
        plaintext_key: &str,
    ) -> Result<String, AppError> {
        let mut contents: Vec<GeminiContent> = Vec::new();

        for msg in conversation_history {
            let role = if msg.sender_id == agent.user_id {
                "model"
            } else {
                "user"
            };

            // Gemini strictly requires alternating roles between 'user' and 'model'.
            // Merge consecutive messages with the same role into a single turn.
            if let Some(last) = contents.last_mut() {
                if last.role == role {
                    last.parts.push(GeminiPart {
                        text: format!("\n{}", msg.content),
                    });
                    continue;
                }
            }

            contents.push(GeminiContent {
                role: role.to_string(),
                parts: vec![GeminiPart {
                    text: msg.content.clone(),
                }],
            });
        }

        // Gemini API strictly requires that the first content turn has role 'user'
        while !contents.is_empty() && contents[0].role != "user" {
            contents.remove(0);
        }

        // If history was empty or only had model turns, provide fallback user turn
        if contents.is_empty() {
            contents.push(GeminiContent {
                role: "user".to_string(),
                parts: vec![GeminiPart {
                    text: "Merhaba!".to_string(),
                }],
            });
        }

        let system_instruction = if !system_prompt.is_empty() {
            Some(GeminiSystemInstruction {
                parts: vec![GeminiPart {
                    text: system_prompt.to_string(),
                }],
            })
        } else {
            None
        };

        let req_body = GeminiRequest {
            contents,
            system_instruction,
        };

        let model = if !agent.model.is_empty() {
            agent.model.clone()
        } else {
            "gemini-1.5-flash".to_string()
        };

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            model, plaintext_key
        );

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
                .post(&url)
                .header("Content-Type", "application/json")
                .json(&req_body)
                .send()
                .await;

            match res {
                Ok(response) => {
                    let status = response.status();
                    if status.is_success() {
                        let ai_resp: GeminiResponse = response
                            .json()
                            .await
                            .map_err(|e| AppError::Internal(format!("Failed to parse Gemini response: {}", e)))?;

                        if let Some(candidates) = ai_resp.candidates {
                            if let Some(candidate) = candidates.first() {
                                if let Some(part) = candidate.content.parts.first() {
                                    return Ok(part.text.clone());
                                }
                            }
                        }

                        return Err(AppError::Internal("No content returned from Gemini".to_string()));
                    }

                    let status_code = status.as_u16();
                    let error_text = response.text().await.unwrap_or_default();
                    error!(
                        "Gemini API error (attempt {}/{}): {} - {}",
                        attempts, max_attempts, status, error_text
                    );
                    last_error_msg = format!("Gemini API error: {} - {}", status, error_text);

                    // 503 Service Unavailable, 429 Too Many Requests, or 5xx server errors warrant retry
                    if (status_code == 503 || status_code == 429 || status.is_server_error()) && attempts < max_attempts {
                        let backoff_secs = attempts;
                        tracing::warn!("Retrying Gemini API call in {}s due to {}...", backoff_secs, status);
                        tokio::time::sleep(Duration::from_secs(backoff_secs as u64)).await;
                        continue;
                    }

                    return Err(AppError::Internal(last_error_msg));
                }
                Err(e) => {
                    error!(
                        "Gemini request failed (attempt {}/{}): {}",
                        attempts, max_attempts, e
                    );
                    last_error_msg = format!("Gemini request failed: {}", e);
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
