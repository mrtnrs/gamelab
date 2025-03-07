export interface Game {
  id: string;
  title: string;
  slug?: string;
  description: string;
  image_url?: string;
  url: string;
  developer: string;
  developer_url?: string;
  created_at: string;
  updated_at?: string;
  published: boolean;
  rating_average?: number;
  rating_count?: number;
  tags?: string[];
  gallery_images?: string[];
  is_multiplayer?: boolean;
  is_mobile_compatible?: boolean;
  visit_count?: number;
  claimed?: boolean;
  changelogs?: Changelog[];
  category?: string;
  status?: string;
  featured?: boolean;
}

export interface Changelog {
  id: string;
  title: string;
  version: string;
  date: string;
  content: string;
}

export type GameFormData = Omit<Game, 'id' | 'created_at' | 'updated_at'> & {
  // Temporary field for tags input
  _tagsInput?: string;
};

export interface GameCategory {
  id: string;
  name: string;
}

export interface GameTag {
  id: string;
  name: string;
}
