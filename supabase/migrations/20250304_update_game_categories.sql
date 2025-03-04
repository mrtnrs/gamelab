-- Update games to have category_id based on their category text field
UPDATE games
SET category_id = (
  SELECT id 
  FROM categories 
  WHERE LOWER(categories.slug) = LOWER(games.category)
  LIMIT 1
)
WHERE category IS NOT NULL AND category_id IS NULL;

-- Set default status for games without status
UPDATE games
SET status = 'published'
WHERE status IS NULL;
