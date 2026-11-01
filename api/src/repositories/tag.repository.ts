import { query } from '../config/db.js';
import type { Tag } from '../types/index.js';
import { toSlug } from '../utils/slug.js';

export const tagRepository = {
  async findAll(): Promise<Tag[]> {
    const result = await query<Tag>('SELECT * FROM tags ORDER BY name ASC');
    return result.rows;
  },

  async findOrCreate(name: string): Promise<Tag> {
    const slug = toSlug(name);
    const existing = await query<Tag>('SELECT * FROM tags WHERE slug = $1', [slug]);
    if (existing.rows[0]) return existing.rows[0];
    const result = await query<Tag>(
      'INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING *',
      [name, slug]
    );
    return result.rows[0];
  },

  async findByNames(names: string[]): Promise<Tag[]> {
    const tags: Tag[] = [];
    for (const name of names) {
      tags.push(await this.findOrCreate(name));
    }
    return tags;
  },
};
