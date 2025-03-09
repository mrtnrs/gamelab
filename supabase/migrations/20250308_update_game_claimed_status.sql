-- Function to update a game's claimed status
CREATE OR REPLACE FUNCTION update_game_claimed_status(game_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the game's claimed status
  UPDATE games
  SET claimed = TRUE
  WHERE id = game_id;
END;
$$ LANGUAGE plpgsql;