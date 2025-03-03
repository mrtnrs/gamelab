export interface Game {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  url: string;
  created_at: string;
  updated_at: string;
  featured: boolean;
  developer: string;
  tags: string[];
  status: 'published' | 'draft';
}

export type GameFormData = Omit<Game, 'id' | 'created_at' | 'updated_at'>;

export interface GameCategory {
  id: string;
  name: string;
}

export interface GameTag {
  id: string;
  name: string;
}
