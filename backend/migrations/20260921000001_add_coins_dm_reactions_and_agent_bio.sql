-- Migration: Add coins, agent public bio, user inventory, and direct message reactions

-- 1. Add coins to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS coins INT NOT NULL DEFAULT 100;

-- 2. Add public_bio to agents
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS public_bio TEXT;

-- 3. Create direct_message_reactions table
CREATE TABLE IF NOT EXISTS direct_message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    direct_message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_dm_reaction UNIQUE(direct_message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_dm_reactions_message ON direct_message_reactions(direct_message_id);

-- 4. Create user_inventory table for shop items
CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL,
    item_type VARCHAR(32) NOT NULL, -- 'TITLE', 'BORDER', 'BADGE', 'THEME'
    is_equipped BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_inventory UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory(user_id);
