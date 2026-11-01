import { query } from '../config/db.js';

export const searchService = {
  async search(q: string, limit = 20) {
    const term = `%${q.trim()}%`;
    if (!q.trim()) {
      return { topics: [], categories: [], tags: [], resources: [] };
    }

    const [topics, categories, tags, resources] = await Promise.all([
      query(
        `SELECT t.id, t.title, t.slug, t.short_description, t.subtitle, c.slug AS category_slug, c.name AS category_name
         FROM topics t
         JOIN categories c ON c.id = t.category_id
         WHERE t.status = 'PUBLISHED' AND (
           t.title ILIKE $1 OR t.short_description ILIKE $1 OR t.subtitle ILIKE $1
         )
         ORDER BY t.title ASC
         LIMIT $2`,
        [term, limit]
      ),
      query(
        `SELECT id, name, slug, description FROM categories
         WHERE is_active = TRUE AND (name ILIKE $1 OR description ILIKE $1)
         ORDER BY name ASC LIMIT $2`,
        [term, limit]
      ),
      query(
        `SELECT id, name, slug FROM tags WHERE name ILIKE $1 ORDER BY name ASC LIMIT $2`,
        [term, limit]
      ),
      query(
        `SELECT r.id, r.title, r.description, r.resource_type, r.url, t.slug AS topic_slug, c.slug AS category_slug
         FROM resources r
         JOIN topics t ON t.id = r.topic_id
         JOIN categories c ON c.id = t.category_id
         WHERE t.status = 'PUBLISHED' AND (r.title ILIKE $1 OR r.description ILIKE $1)
         ORDER BY r.title ASC LIMIT $2`,
        [term, limit]
      ),
    ]);

    return {
      topics: topics.rows,
      categories: categories.rows,
      tags: tags.rows,
      resources: resources.rows,
    };
  },
};
