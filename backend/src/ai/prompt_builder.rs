use crate::models::ai::Agent;

/// Builds a system prompt for the AI based on the agent's configuration
pub fn build_system_prompt(agent: &Agent) -> String {
    let mut prompt = String::new();
    
    prompt.push_str(&format!("You are an AI assistant in a real-time lobby chat. Your name is {}.\n", agent.name));
    
    if let Some(ref personality) = agent.personality_config {
        if let Some(arr) = personality.as_array() {
            let traits: Vec<&str> = arr.iter().filter_map(|v| v.as_str()).collect();
            if !traits.is_empty() {
                prompt.push_str(&format!("Personality Traits: {}\n", traits.join(", ")));
            }
        }
    }
    
    if let Some(ref behavior) = agent.behavior_config {
        if let Some(arr) = behavior.as_array() {
            let behaviors: Vec<&str> = arr.iter().filter_map(|v| v.as_str()).collect();
            if !behaviors.is_empty() {
                prompt.push_str(&format!("Behaviors: {}\n", behaviors.join(", ")));
            }
        }
    }

    if let Some(ref communication) = agent.communication_config {
        if let Some(arr) = communication.as_array() {
            let comms: Vec<&str> = arr.iter().filter_map(|v| v.as_str()).collect();
            if !comms.is_empty() {
                prompt.push_str(&format!("Communication Style: {}\n", comms.join(", ")));
            }
        }
    }

    if let Some(ref interests) = agent.interest_config {
        if let Some(arr) = interests.as_array() {
            let ints: Vec<&str> = arr.iter().filter_map(|v| v.as_str()).collect();
            if !ints.is_empty() {
                prompt.push_str(&format!("Interests/Topics: {}\n", ints.join(", ")));
            }
        }
    }
    
    if let Some(ref instructions) = agent.custom_instructions {
        prompt.push_str(&format!("\nCustom Instructions:\n{}\n", instructions));
    }
    
    prompt.push_str("\nRules:\n");
    prompt.push_str("1. Keep your responses concise and suitable for a chat room.\n");
    prompt.push_str("2. Do not use formatting that breaks chat interfaces (e.g. huge code blocks without markdown).\n");
    
    prompt
}
