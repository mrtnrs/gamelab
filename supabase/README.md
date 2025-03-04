# Supabase Migrations

This directory contains SQL migrations for the GameLab project.

## How to Apply Migrations

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of each migration file
4. Run the SQL commands in order

## Migration Files

- `20250304_create_game_submissions.sql`: Creates the game_submissions table for storing user game submissions

## Database Schema

### Games Table

The main table for storing game information with the following columns:
- id (UUID)
- title (TEXT)
- description (TEXT)
- image_url (TEXT)
- url (TEXT)
- category (TEXT)
- tags (TEXT[])
- featured (BOOLEAN)
- status (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- developer (TEXT)
- rating_count (INTEGER)
- rating_total (INTEGER)
- rating_average (FLOAT)
- visit_count (INTEGER)
- is_mobile_compatible (BOOLEAN)

### Game Ratings Table

Stores individual user ratings for games:
- id (UUID)
- game_id (UUID) - Foreign key to games table
- user_id (TEXT) - Can be null for anonymous users
- rating (INTEGER) - Value between 1-5
- user_ip (TEXT)
- created_at (TIMESTAMP)

### Game Submissions Table

Stores user game submissions:
- id (SERIAL)
- name (TEXT)
- link_to_socials (TEXT)
- email (TEXT) - Optional
- submitted_at (TIMESTAMP)
