export type UserRole = 'ADMIN' | 'USER';
export type TopicStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type SectionType =
  | 'MENTAL_MODEL'
  | 'INTRODUCTION'
  | 'ARCHITECTURE'
  | 'CONCEPT'
  | 'DEEP_DIVE'
  | 'SCENARIO'
  | 'EXAM_TIP'
  | 'KEY_TAKEAWAY'
  | 'CUSTOM';
export type DiagramType = 'IMAGE' | 'SVG' | 'HTML';
export type ResourceType =
  | 'OFFICIAL_DOC'
  | 'VIDEO'
  | 'ARTICLE'
  | 'PDF'
  | 'GITHUB'
  | 'CHEAT_SHEET'
  | 'REFERENCE'
  | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  cover_image: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
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
  difficulty: Difficulty;
  status: TopicStatus;
  display_order: number;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TopicSection {
  id: string;
  topic_id: string;
  section_type: SectionType;
  title: string;
  subtitle: string | null;
  content: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Diagram {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  diagram_type: DiagramType;
  file_path: string | null;
  thumbnail_path: string | null;
  display_order: number;
  is_interactive: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Resource {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  resource_type: ResourceType;
  url: string | null;
  file_path: string | null;
  display_order: number;
  is_external: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  difficulty: Difficulty;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  difficulty: Difficulty;
  scenario: string | null;
  requirements: string[];
  status: TopicStatus;
  challenge_number: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChallengeOption {
  id: string;
  challenge_id: string;
  title: string;
  description: string | null;
  is_correct: boolean;
  explanation: string | null;
  display_order: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
