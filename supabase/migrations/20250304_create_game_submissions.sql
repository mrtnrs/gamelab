-- Create game_submissions table
CREATE TABLE IF NOT EXISTS game_submissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  link_to_socials TEXT NOT NULL,
  email TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_game_submissions_submitted_at ON game_submissions(submitted_at);

-- Set up RLS (Row Level Security) policies
ALTER TABLE game_submissions ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated and anonymous users
CREATE POLICY "Allow inserts for all users" ON game_submissions
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Only allow admins to view submissions
CREATE POLICY "Allow select for service_role only" ON game_submissions
  FOR SELECT TO service_role
  USING (true);
