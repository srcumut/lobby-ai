CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT prevent_self_request CHECK (sender_id != receiver_id)
);

-- Ensure there can only be one relationship (pending or accepted) between any two users
CREATE UNIQUE INDEX idx_unique_friendship ON friend_requests (
    LEAST(sender_id, receiver_id), 
    GREATEST(sender_id, receiver_id)
);

CREATE INDEX idx_friend_requests_receiver_status ON friend_requests (receiver_id, status);
CREATE INDEX idx_friend_requests_sender_status ON friend_requests (sender_id, status);
