import { query } from '../config/db.js';
import type { LearningPath } from '../types/index.js';

export interface LearningPathTopicRow {
  id: string;
  learning_path_id: string;
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

export const learningPathRepository = {
  async findAll(activeOnly = false): Promise<(LearningPath & { topic_count: number })[]> {
    const where = activeOnly ? 'WHERE lp.is_active = TRUE' : '';
    const result = await query<LearningPath & { topic_count: number }>(
      `SELECT lp.*,
        (SELECT COUNT(*)::int FROM learning_path_topics lpt WHERE lpt.learning_path_id = lp.id) AS topic_count
       FROM learning_paths lp
       ${where}
       ORDER BY lp.display_order ASC`
    );
    return result.rows;
  },

  async findBySlug(slug: string): Promise<LearningPath | null> {
    const result = await query<LearningPath>('SELECT * FROM learning_paths WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  },

  async findById(id: string): Promise<LearningPath | null> {
    const result = await query<LearningPath>('SELECT * FROM learning_paths WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findTopics(pathId: string): Promise<LearningPathTopicRow[]> {
    const result = await query<LearningPathTopicRow>(
      `SELECT lpt.*, t.title, t.slug, t.short_description, t.status, t.reading_time, c.slug AS category_slug
       FROM learning_path_topics lpt
       JOIN topics t ON t.id = lpt.topic_id
       JOIN categories c ON c.id = t.category_id
       WHERE lpt.learning_path_id = $1
       ORDER BY lpt.display_order ASC`,
      [pathId]
    );
    return result.rows;
  },

  async create(data: {
    title: string;
    slug: string;
    description?: string | null;
    cover_image?: string | null;
    difficulty?: string;
    display_order?: number;
    is_active?: boolean;
  }): Promise<LearningPath> {
    const result = await query<LearningPath>(
      `INSERT INTO learning_paths (title, slug, description, cover_image, difficulty, display_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        data.title,
        data.slug,
        data.description ?? null,
        data.cover_image ?? null,
        data.difficulty ?? 'INTERMEDIATE',
        data.display_order ?? 0,
        data.is_active ?? true,
      ]
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<LearningPath>): Promise<LearningPath | null> {
    const result = await query<LearningPath>(
      `UPDATE learning_paths SET
         title = COALESCE($2, title),
         slug = COALESCE($3, slug),
         description = COALESCE($4, description),
         cover_image = COALESCE($5, cover_image),
         difficulty = COALESCE($6, difficulty),
         display_order = COALESCE($7, display_order),
         is_active = COALESCE($8, is_active)
       WHERE id = $1 RETURNING *`,
      [
        id,
        data.title ?? null,
        data.slug ?? null,
        data.description ?? null,
        data.cover_image ?? null,
        data.difficulty ?? null,
        data.display_order ?? null,
        data.is_active ?? null,
      ]
    );
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM learning_paths WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async setTopics(
    pathId: string,
    topics: { topic_id: string; display_order: number; is_required?: boolean }[]
  ): Promise<void> {
    await query('DELETE FROM learning_path_topics WHERE learning_path_id = $1', [pathId]);
    for (const t of topics) {
      await query(
        `INSERT INTO learning_path_topics (learning_path_id, topic_id, display_order, is_required)
         VALUES ($1, $2, $3, $4)`,
        [pathId, t.topic_id, t.display_order, t.is_required ?? true]
      );
    }
  },
};
