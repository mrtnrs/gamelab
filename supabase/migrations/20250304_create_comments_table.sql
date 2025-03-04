-- Create comments table
CREATE TABLE IF NOT EXISTS game_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_ip TEXT NOT NULL,
  user_id TEXT, -- This can be null for anonymous users
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_comments_game_id ON game_comments(game_id);

-- Set up RLS (Row Level Security) policies
ALTER TABLE game_comments ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated and anonymous users
CREATE POLICY "Allow inserts for all users" ON game_comments
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Allow users to see all comments
CREATE POLICY "Allow select for all users" ON game_comments
  FOR SELECT TO authenticated, anon
  USING (true);

-- Only allow users to delete their own comments
CREATE POLICY "Allow delete for comment owners" ON game_comments
  FOR DELETE TO authenticated, anon
  USING (
    (user_ip = current_setting('request.headers')::json->>'x-forwarded-for') OR 
    (user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::TEXT)
  );

-- Function to get comments for a game
CREATE OR REPLACE FUNCTION get_game_comments(game_uuid UUID)
RETURNS TABLE (
  id TEXT,
  game_id TEXT,
  comment_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gc.id::TEXT,
    gc.game_id::TEXT,
    gc.comment_text,
    gc.created_at
  FROM game_comments gc
  WHERE gc.game_id = game_uuid
  ORDER BY gc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to add a comment with spam prevention
CREATE OR REPLACE FUNCTION add_game_comment(
  p_game_id TEXT,
  p_comment_text TEXT,
  p_user_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_ip TEXT;
  v_comment_id UUID;
  v_game_uuid UUID;
  v_today DATE;
BEGIN
  -- Convert input game_id from TEXT to UUID
  BEGIN
    v_game_uuid := p_game_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid game ID format'
    );
  END;
  
  -- Set today's date
  v_today := CURRENT_DATE;
  
  -- Get the user's IP address
  v_user_ip := current_setting('request.headers')::json->>'x-forwarded-for';
  
  -- Check if user has already commented on this game today
  IF EXISTS (
    SELECT 1 FROM game_comments 
    WHERE game_id = v_game_uuid 
    AND user_ip = v_user_ip 
    AND DATE(created_at) = v_today
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You can only post one comment per game per day'
    );
  END IF;
  
  -- Insert the comment
  INSERT INTO game_comments (game_id, user_ip, user_id, comment_text)
  VALUES (v_game_uuid, v_user_ip, p_user_id, p_comment_text)
  RETURNING id INTO v_comment_id;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'comment_id', v_comment_id::TEXT
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
