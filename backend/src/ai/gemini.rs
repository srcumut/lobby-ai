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
        let mut contents = Vec::new();

        for msg in conversation_history {
            let role = if msg.sender_id == agent.user_id {
                "model"
            } else {
                "user"
            };
            contents.push(GeminiContent {
                role: role.to_string(),
                parts: vec![GeminiPart {
                    text: msg.content.clone(),
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

        let res = client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&req_body)
            .send()
            .await;

        match res {
            Ok(response) => {
                if !response.status().is_success() {
                    let status = response.status();
                    let text = response.text().await.unwrap_or_default();
                    error!("Gemini API error: {} - {}", status, text);
                    return Err(AppError::Internal(format!("Gemini API error: {}", status)));
                }

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

                Err(AppError::Internal("No content returned from Gemini".to_string()))
            }
            Err(e) => {
                error!("Gemini request failed: {}", e);
                Err(AppError::Internal(format!("Gemini request failed: {}", e)))
            }
        }
    }
}
