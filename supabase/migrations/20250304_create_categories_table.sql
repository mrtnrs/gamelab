-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Add categories column to games table if it doesn't exist
ALTER TABLE games ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_games_category_id ON games(category_id);

-- Insert some initial categories
INSERT INTO categories (name, slug, image, description)
VALUES
  ('Action', 'action', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070', 'Fast-paced games focusing on combat and reflexes'),
  ('Adventure', 'adventure', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070', 'Story-driven exploration games'),
  ('RPG', 'rpg', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071', 'Role-playing games with character development'),
  ('Strategy', 'strategy', 'https://images.unsplash.com/photo-1536104968055-4d61aa56f46a?q=80&w=2080', 'Games that require planning and strategic thinking'),
  ('Simulation', 'simulation', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059', 'Realistic simulations of real-world activities'),
  ('Sports', 'sports', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070', 'Games based on real-world sports'),
  ('Racing', 'racing', 'https://images.unsplash.com/photo-1559163499-413811fb2344?q=80&w=2070', 'High-speed racing games'),
  ('Puzzle', 'puzzle', 'https://images.unsplash.com/photo-1547638375-ebf04735d792?q=80&w=2013', 'Brain teasers and puzzle-solving games'),
  ('Horror', 'horror', 'https://images.unsplash.com/photo-1608889175638-9322300c46e8?q=80&w=2080', 'Scary games designed to frighten players'),
  ('Platformer', 'platformer', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025', 'Games involving jumping between platforms'),
  ('Shooter', 'shooter', 'https://images.unsplash.com/photo-1543536448-d209d2d13a1c?q=80&w=2070', 'Games focused on shooting enemies or targets'),
  ('Fighting', 'fighting', 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070', 'Combat games focusing on martial arts or melee fighting')
ON CONFLICT (slug) DO NOTHING;

-- Function to get categories with game counts
CREATE OR REPLACE FUNCTION get_categories_with_counts()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  image TEXT,
  description TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.image,
    c.description,
    COUNT(g.id) AS count
  FROM categories c
  LEFT JOIN games g ON c.id = g.category_id AND g.status = 'published'
  GROUP BY c.id, c.name, c.slug, c.image, c.description
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql;
