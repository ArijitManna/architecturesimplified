import { query } from '../config/db.js';
import type { TopicSection } from '../types/index.js';

export const sectionRepository = {
  async findByTopic(topicId: string, activeOnly = false): Promise<TopicSection[]> {
    const where = activeOnly
      ? 'WHERE topic_id = $1 AND is_active = TRUE'
      : 'WHERE topic_id = $1';
    const result = await query<TopicSection>(
      `SELECT * FROM topic_sections ${where} ORDER BY display_order ASC`,
      [topicId]
    );
    return result.rows;
  },

  async findById(id: string): Promise<TopicSection | null> {
    const result = await query<TopicSection>('SELECT * FROM topic_sections WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: {
    topic_id: string;
    section_type: string;
    title: string;
    subtitle?: string | null;
    content?: string;
    display_order?: number;
    is_active?: boolean;
  }): Promise<TopicSection> {
    const result = await query<TopicSection>(
      `INSERT INTO topic_sections (topic_id, section_type, title, subtitle, content, display_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        data.topic_id,
        data.section_type,
        data.title,
        data.subtitle ?? null,
        data.content ?? '',
        data.display_order ?? 0,
        data.is_active ?? true,
      ]
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<TopicSection>): Promise<TopicSection | null> {
    const result = await query<TopicSection>(
      `UPDATE topic_sections SET
         section_type = COALESCE($2, section_type),
         title = COALESCE($3, title),
         subtitle = COALESCE($4, subtitle),
         content = COALESCE($5, content),
         display_order = COALESCE($6, display_order),
         is_active = COALESCE($7, is_active)
       WHERE id = $1 RETURNING *`,
      [
        id,
        data.section_type ?? null,
        data.title ?? null,
        data.subtitle ?? null,
        data.content ?? null,
        data.display_order ?? null,
        data.is_active ?? null,
      ]
    );
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM topic_sections WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
