export interface Game {
  id: string;
  title: string;
  description: string;
  image_url: string;
  gallery_images?: string[];
  category: string;
  url: string;
  created_at: string;
  updated_at: string;
  featured: boolean;
  developer: string;
  developer_url?: string;
  tags: string[];
  status: 'published' | 'draft';
  is_mobile_compatible?: boolean;
  is_multiplayer?: boolean;
  rating_count?: number;
  rating_total?: number;
  rating_average?: number;
  visit_count?: number;
  slug?: string; // Added slug property
  category_id?: string; // Added category_id property for consistency
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
