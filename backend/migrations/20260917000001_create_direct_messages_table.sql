CREATE TABLE direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT prevent_self_dm CHECK (sender_id != receiver_id)
);

-- Efficient indexing for querying conversations chronologically between two users
CREATE INDEX idx_dm_conversation ON direct_messages (
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id),
    created_at ASC
);

-- Fast lookup for unread messages per receiver
CREATE INDEX idx_dm_receiver_unread ON direct_messages (receiver_id, is_read) WHERE NOT is_read;
