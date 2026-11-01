export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  cover_image: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Topic {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  short_description: string | null;
  subtitle: string | null;
  cover_image: string | null;
  topic_number: number | null;
  reading_time: number | null;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  display_order: number;
  published_at: string | null;
  category_name?: string;
  category_slug?: string;
  tags?: Tag[];
}

export interface TopicSection {
  id: string;
  topic_id: string;
  section_type: string;
  title: string;
  subtitle: string | null;
  content: string;
  display_order: number;
  is_active: boolean;
}

export interface Diagram {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  diagram_type: 'IMAGE' | 'SVG' | 'HTML';
  file_path: string | null;
  thumbnail_path: string | null;
  display_order: number;
  is_interactive: boolean;
}

export interface Resource {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  resource_type: string;
  url: string | null;
  file_path: string | null;
  display_order: number;
  is_external: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  difficulty: string;
  display_order: number;
  is_active: boolean;
  topic_count?: number;
}

export interface LearningPathTopic {
  id: string;
  topic_id: string;
  display_order: number;
  is_required: boolean;
  title: string;
  slug: string;
  short_description: string | null;
  status: string;
  category_slug: string;
  reading_time: number | null;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  difficulty: string;
  scenario: string | null;
  requirements: string[];
  status: string;
  challenge_number: number | null;
}

export interface ChallengeOption {
  id: string;
  challenge_id: string;
  title: string;
  description: string | null;
  is_correct?: boolean;
  explanation?: string | null;
  display_order: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}
