import { query } from '../config/db.js';
import type { Topic, TopicStatus } from '../types/index.js';

export interface TopicFilters {
  categoryId?: string;
  categorySlug?: string;
  status?: TopicStatus | TopicStatus[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TopicWithMeta extends Topic {
  category_name?: string;
  category_slug?: string;
  tags?: { id: string; name: string; slug: string }[];
}

export const topicRepository = {
  async findAll(filters: TopicFilters = {}): Promise<TopicWithMeta[]> {
    const clauses: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (filters.categoryId) {
      clauses.push(`t.category_id = $${i++}`);
      params.push(filters.categoryId);
    }
    if (filters.categorySlug) {
      clauses.push(`c.slug = $${i++}`);
      params.push(filters.categorySlug);
    }
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      clauses.push(`t.status = ANY($${i++})`);
      params.push(statuses);
    }
    if (filters.search) {
      clauses.push(
        `(t.title ILIKE $${i} OR t.short_description ILIKE $${i} OR t.subtitle ILIKE $${i})`
      );
      params.push(`%${filters.search}%`);
      i++;
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = filters.limit ? `LIMIT ${filters.limit}` : '';
    const offset = filters.offset ? `OFFSET ${filters.offset}` : '';

    const result = await query<TopicWithMeta>(
      `SELECT t.*, c.name AS category_name, c.slug AS category_slug,
        COALESCE(
          (SELECT json_agg(json_build_object('id', tg.id, 'name', tg.name, 'slug', tg.slug))
           FROM topic_tags tt JOIN tags tg ON tg.id = tt.tag_id WHERE tt.topic_id = t.id),
          '[]'
        ) AS tags
       FROM topics t
       JOIN categories c ON c.id = t.category_id
       ${where}
       ORDER BY t.display_order ASC, t.topic_number ASC NULLS LAST, t.title ASC
       ${limit} ${offset}`,
      params
    );
    return result.rows;
  },

  async findBySlug(categorySlug: string, topicSlug: string): Promise<TopicWithMeta | null> {
    const result = await query<TopicWithMeta>(
      `SELECT t.*, c.name AS category_name, c.slug AS category_slug,
        COALESCE(
          (SELECT json_agg(json_build_object('id', tg.id, 'name', tg.name, 'slug', tg.slug))
           FROM topic_tags tt JOIN tags tg ON tg.id = tt.tag_id WHERE tt.topic_id = t.id),
          '[]'
        ) AS tags
       FROM topics t
       JOIN categories c ON c.id = t.category_id
       WHERE c.slug = $1 AND t.slug = $2`,
      [categorySlug, topicSlug]
    );
    return result.rows[0] || null;
  },

  async findById(id: string): Promise<TopicWithMeta | null> {
    const result = await query<TopicWithMeta>(
      `SELECT t.*, c.name AS category_name, c.slug AS category_slug,
        COALESCE(
          (SELECT json_agg(json_build_object('id', tg.id, 'name', tg.name, 'slug', tg.slug))
           FROM topic_tags tt JOIN tags tg ON tg.id = tt.tag_id WHERE tt.topic_id = t.id),
          '[]'
        ) AS tags
       FROM topics t
       JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create(data: {
    category_id: string;
    title: string;
    slug: string;
    short_description?: string | null;
    subtitle?: string | null;
    cover_image?: string | null;
    topic_number?: number | null;
    reading_time?: number | null;
    difficulty?: string;
    status?: string;
    display_order?: number;
  }): Promise<Topic> {
    const result = await query<Topic>(
      `INSERT INTO topics (
         category_id, title, slug, short_description, subtitle, cover_image,
         topic_number, reading_time, difficulty, status, display_order, published_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        data.category_id,
        data.title,
        data.slug,
        data.short_description ?? null,
        data.subtitle ?? null,
        data.cover_image ?? null,
        data.topic_number ?? null,
        data.reading_time ?? 10,
        data.difficulty ?? 'BEGINNER',
        data.status ?? 'DRAFT',
        data.display_order ?? 0,
        data.status === 'PUBLISHED' ? new Date() : null,
      ]
    );
    return result.rows[0];
  },

  async update(id: string, data: Record<string, unknown>): Promise<Topic | null> {
    const fields: string[] = [];
    const params: unknown[] = [id];
    let i = 2;

    const allowed = [
      'category_id', 'title', 'slug', 'short_description', 'subtitle', 'cover_image',
      'topic_number', 'reading_time', 'difficulty', 'status', 'display_order', 'published_at',
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${i++}`);
        params.push(data[key]);
      }
    }

    if (!fields.length) return this.findById(id);

    const result = await query<Topic>(
      `UPDATE topics SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM topics WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async setTags(topicId: string, tagIds: string[]): Promise<void> {
    await query('DELETE FROM topic_tags WHERE topic_id = $1', [topicId]);
    for (const tagId of tagIds) {
      await query(
        'INSERT INTO topic_tags (topic_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [topicId, tagId]
      );
    }
  },

  async findRelated(topicId: string, categoryId: string, limit = 4): Promise<TopicWithMeta[]> {
    const result = await query<TopicWithMeta>(
      `SELECT t.*, c.name AS category_name, c.slug AS category_slug
       FROM topics t
       JOIN categories c ON c.id = t.category_id
       WHERE t.status = 'PUBLISHED' AND t.id <> $1 AND (
         t.category_id = $2 OR t.id IN (
           SELECT tt2.topic_id FROM topic_tags tt1
           JOIN topic_tags tt2 ON tt2.tag_id = tt1.tag_id
           WHERE tt1.topic_id = $1 AND tt2.topic_id <> $1
         )
       )
       ORDER BY t.display_order ASC
       LIMIT $3`,
      [topicId, categoryId, limit]
    );
    return result.rows;
  },

  async count(status?: TopicStatus): Promise<number> {
    if (status) {
      const result = await query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM topics WHERE status = $1',
        [status]
      );
      return parseInt(result.rows[0].count, 10);
    }
    const result = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM topics');
    return parseInt(result.rows[0].count, 10);
  },

  async duplicate(id: string): Promise<Topic | null> {
    const original = await this.findById(id);
    if (!original) return null;

    const newSlug = `${original.slug}-copy-${Date.now()}`;
    const copy = await this.create({
      category_id: original.category_id,
      title: `${original.title} (Copy)`,
      slug: newSlug,
      short_description: original.short_description,
      subtitle: original.subtitle,
      cover_image: original.cover_image,
      topic_number: original.topic_number,
      reading_time: original.reading_time ?? 10,
      difficulty: original.difficulty,
      status: 'DRAFT',
      display_order: original.display_order,
    });

    await query(
      `INSERT INTO topic_sections (topic_id, section_type, title, subtitle, content, display_order, is_active)
       SELECT $1, section_type, title, subtitle, content, display_order, is_active
       FROM topic_sections WHERE topic_id = $2`,
      [copy.id, id]
    );

    await query(
      `INSERT INTO topic_tags (topic_id, tag_id)
       SELECT $1, tag_id FROM topic_tags WHERE topic_id = $2`,
      [copy.id, id]
    );

    return copy;
  },
};
