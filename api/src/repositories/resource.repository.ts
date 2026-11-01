import { query } from '../config/db.js';
import type { Resource } from '../types/index.js';

export const resourceRepository = {
  async findByTopic(topicId: string): Promise<Resource[]> {
    const result = await query<Resource>(
      'SELECT * FROM resources WHERE topic_id = $1 ORDER BY display_order ASC',
      [topicId]
    );
    return result.rows;
  },

  async findById(id: string): Promise<Resource | null> {
    const result = await query<Resource>('SELECT * FROM resources WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: {
    topic_id: string;
    title: string;
    description?: string | null;
    resource_type?: string;
    url?: string | null;
    file_path?: string | null;
    display_order?: number;
    is_external?: boolean;
  }): Promise<Resource> {
    const result = await query<Resource>(
      `INSERT INTO resources (topic_id, title, description, resource_type, url, file_path, display_order, is_external)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        data.topic_id,
        data.title,
        data.description ?? null,
        data.resource_type ?? 'OTHER',
        data.url ?? null,
        data.file_path ?? null,
        data.display_order ?? 0,
        data.is_external ?? true,
      ]
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<Resource>): Promise<Resource | null> {
    const result = await query<Resource>(
      `UPDATE resources SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         resource_type = COALESCE($4, resource_type),
         url = COALESCE($5, url),
         file_path = COALESCE($6, file_path),
         display_order = COALESCE($7, display_order),
         is_external = COALESCE($8, is_external)
       WHERE id = $1 RETURNING *`,
      [
        id,
        data.title ?? null,
        data.description ?? null,
        data.resource_type ?? null,
        data.url ?? null,
        data.file_path ?? null,
        data.display_order ?? null,
        data.is_external ?? null,
      ]
    );
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM resources WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async count(): Promise<number> {
    const result = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM resources');
    return parseInt(result.rows[0].count, 10);
  },
};
