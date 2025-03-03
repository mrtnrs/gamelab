import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type Game = {
  id: string;
  title: string;
  slug: string;
  description: string;
  feature_image: string;
  year: string;
  rating: number;
  category: string;
  trending: boolean;
  featured: boolean;
  creator_id: string;
  created_at: string;
  gallery?: string[];
  features?: string[];
};

export type User = {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'user' | 'admin';
};

export type Comment = {
  id: string;
  game_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    name: string;
    avatar_url?: string;
  };
};
