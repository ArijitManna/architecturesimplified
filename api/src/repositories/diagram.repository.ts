import { query } from '../config/db.js';
import type { Diagram } from '../types/index.js';

export const diagramRepository = {
  async findByTopic(topicId: string): Promise<Diagram[]> {
    const result = await query<Diagram>(
      'SELECT * FROM diagrams WHERE topic_id = $1 ORDER BY display_order ASC',
      [topicId]
    );
    return result.rows;
  },

  async findById(id: string): Promise<Diagram | null> {
    const result = await query<Diagram>('SELECT * FROM diagrams WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: {
    topic_id: string;
    title: string;
    description?: string | null;
    diagram_type?: string;
    file_path?: string | null;
    thumbnail_path?: string | null;
    display_order?: number;
    is_interactive?: boolean;
  }): Promise<Diagram> {
    const result = await query<Diagram>(
      `INSERT INTO diagrams (topic_id, title, description, diagram_type, file_path, thumbnail_path, display_order, is_interactive)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        data.topic_id,
        data.title,
        data.description ?? null,
        data.diagram_type ?? 'IMAGE',
        data.file_path ?? null,
        data.thumbnail_path ?? null,
        data.display_order ?? 0,
        data.is_interactive ?? false,
      ]
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<Diagram>): Promise<Diagram | null> {
    const result = await query<Diagram>(
      `UPDATE diagrams SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         diagram_type = COALESCE($4, diagram_type),
         file_path = COALESCE($5, file_path),
         thumbnail_path = COALESCE($6, thumbnail_path),
         display_order = COALESCE($7, display_order),
         is_interactive = COALESCE($8, is_interactive)
       WHERE id = $1 RETURNING *`,
      [
        id,
        data.title ?? null,
        data.description ?? null,
        data.diagram_type ?? null,
        data.file_path ?? null,
        data.thumbnail_path ?? null,
        data.display_order ?? null,
        data.is_interactive ?? null,
      ]
    );
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM diagrams WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async count(): Promise<number> {
    const result = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM diagrams');
    return parseInt(result.rows[0].count, 10);
  },
};
