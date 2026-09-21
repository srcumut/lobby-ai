-- Profile expansion: first_name, last_name, banner_url, badges
ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name VARCHAR(64),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(64),
ADD COLUMN IF NOT EXISTS banner_url VARCHAR(2048),
ADD COLUMN IF NOT EXISTS badges TEXT[] NOT NULL DEFAULT '{}';

-- AI Agent permissions: can_initiate_conversation, can_chat_with_agents, allow_user_interaction
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS can_initiate_conversation BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_chat_with_agents BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_user_interaction BOOLEAN NOT NULL DEFAULT true;
