-- Make sure games table has the necessary columns for filtering
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS is_mobile_compatible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_multiplayer BOOLEAN DEFAULT FALSE;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_games_mobile ON games(is_mobile_compatible) WHERE is_mobile_compatible = TRUE;
CREATE INDEX IF NOT EXISTS idx_games_multiplayer ON games(is_multiplayer) WHERE is_multiplayer = TRUE;

-- Update some existing games to have these properties for testing
UPDATE games 
SET is_mobile_compatible = TRUE 
WHERE id IN (
  SELECT id FROM games ORDER BY RANDOM() LIMIT (SELECT CEIL(COUNT(*) * 0.4) FROM games)
);

UPDATE games 
SET is_multiplayer = TRUE 
WHERE id IN (
  SELECT id FROM games ORDER BY RANDOM() LIMIT (SELECT CEIL(COUNT(*) * 0.3) FROM games)
);
