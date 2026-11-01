import { query } from '../config/db.js';
import type { Category } from '../types/index.js';

export interface CategoryFilters {
  activeOnly?: boolean;
}

export const categoryRepository = {
  async findAll(filters: CategoryFilters = {}): Promise<Category[]> {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filters.activeOnly) {
      clauses.push('is_active = TRUE');
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await query<Category>(
      `SELECT * FROM categories ${where} ORDER BY display_order ASC, name ASC`,
      params
    );
    return result.rows;
  },

  async findBySlug(slug: string): Promise<Category | null> {
    const result = await query<Category>('SELECT * FROM categories WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  },

  async findById(id: string): Promise<Category | null> {
    const result = await query<Category>('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: Partial<Category> & { name: string; slug: string }): Promise<Category> {
    const result = await query<Category>(
      `INSERT INTO categories (name, slug, description, icon, cover_image, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.name,
        data.slug,
        data.description ?? null,
        data.icon ?? null,
        data.cover_image ?? null,
        data.display_order ?? 0,
        data.is_active ?? true,
      ]
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    const result = await query<Category>(
      `UPDATE categories SET
         name = COALESCE($2, name),
         slug = COALESCE($3, slug),
         description = COALESCE($4, description),
         icon = COALESCE($5, icon),
         cover_image = COALESCE($6, cover_image),
         display_order = COALESCE($7, display_order),
         is_active = COALESCE($8, is_active)
       WHERE id = $1
       RETURNING *`,
      [
        id,
        data.name ?? null,
        data.slug ?? null,
        data.description ?? null,
        data.icon ?? null,
        data.cover_image ?? null,
        data.display_order ?? null,
        data.is_active ?? null,
      ]
    );
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM categories WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async count(): Promise<number> {
    const result = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM categories');
    return parseInt(result.rows[0].count, 10);
  },
};
