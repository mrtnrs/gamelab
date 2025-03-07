-- Add claimed column to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT FALSE;

-- Add changelogs column to games table as a JSONB array
ALTER TABLE games ADD COLUMN IF NOT EXISTS changelogs JSONB DEFAULT '[]'::jsonb;

-- Update RLS policies to allow developers to update their claimed games
CREATE POLICY update_claimed_games ON games
    FOR UPDATE
    USING (claimed = TRUE)
    WITH CHECK (claimed = TRUE);

-- Create a function to validate developer claims based on X.com handle
CREATE OR REPLACE FUNCTION validate_developer_claim(game_id UUID, x_handle TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    developer_url TEXT;
    url_handle TEXT;
BEGIN
    -- Get the developer_url for the game
    SELECT games.developer_url INTO developer_url
    FROM games
    WHERE games.id = game_id;
    
    -- If no developer_url, return false
    IF developer_url IS NULL OR developer_url = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Extract the handle from the URL
    url_handle := substring(developer_url from 'x\.com/([^/]+)');
    
    -- If no handle found, try twitter.com format as fallback
    IF url_handle IS NULL THEN
        url_handle := substring(developer_url from 'twitter\.com/([^/]+)');
    END IF;
    
    -- Compare handles (case insensitive)
    RETURN LOWER(url_handle) = LOWER(x_handle);
END;
$$ LANGUAGE plpgsql;

-- Comment on the columns for documentation
COMMENT ON COLUMN games.claimed IS 'Whether the game has been claimed by its developer';
COMMENT ON COLUMN games.changelogs IS 'Array of changelogs for the game, each with id, title, version, date, and content';
