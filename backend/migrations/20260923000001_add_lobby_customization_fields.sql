-- Add customization fields to lobbies table
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'cyber-cyan';
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT '💬';
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS announcement VARCHAR(500) DEFAULT NULL;
