import { query } from '../config/db.js';
import type { Challenge, ChallengeOption } from '../types/index.js';

export const challengeRepository = {
  async findAll(publishedOnly = false): Promise<Challenge[]> {
    const where = publishedOnly ? "WHERE status = 'PUBLISHED'" : '';
    const result = await query<Challenge>(
      `SELECT * FROM challenges ${where} ORDER BY challenge_number ASC NULLS LAST, created_at DESC`
    );
    return result.rows.map((row) => ({
      ...row,
      requirements: Array.isArray(row.requirements)
        ? row.requirements
        : typeof row.requirements === 'string'
          ? JSON.parse(row.requirements)
          : [],
    }));
  },

  async findBySlug(slug: string): Promise<Challenge | null> {
    const result = await query<Challenge>('SELECT * FROM challenges WHERE slug = $1', [slug]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      requirements: Array.isArray(row.requirements)
        ? row.requirements
        : typeof row.requirements === 'string'
          ? JSON.parse(row.requirements)
          : [],
    };
  },

  async findById(id: string): Promise<Challenge | null> {
    const result = await query<Challenge>('SELECT * FROM challenges WHERE id = $1', [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      requirements: Array.isArray(row.requirements)
        ? row.requirements
        : typeof row.requirements === 'string'
          ? JSON.parse(row.requirements)
          : [],
    };
  },

  async findOptions(challengeId: string, includeCorrect = false): Promise<ChallengeOption[]> {
    const result = await query<ChallengeOption>(
      'SELECT * FROM challenge_options WHERE challenge_id = $1 ORDER BY display_order ASC',
      [challengeId]
    );
    if (includeCorrect) return result.rows;
    return result.rows.map(({ is_correct: _omit, ...rest }) => ({
      ...rest,
      is_correct: false,
    }));
  },

  async findOptionsFull(challengeId: string): Promise<ChallengeOption[]> {
    const result = await query<ChallengeOption>(
      'SELECT * FROM challenge_options WHERE challenge_id = $1 ORDER BY display_order ASC',
      [challengeId]
    );
    return result.rows;
  },

  async create(data: {
    title: string;
    slug: string;
    description?: string | null;
    difficulty?: string;
    scenario?: string | null;
    requirements?: string[];
    status?: string;
    challenge_number?: number | null;
  }): Promise<Challenge> {
    const result = await query<Challenge>(
      `INSERT INTO challenges (title, slug, description, difficulty, scenario, requirements, status, challenge_number)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8) RETURNING *`,
      [
        data.title,
        data.slug,
        data.description ?? null,
        data.difficulty ?? 'INTERMEDIATE',
        data.scenario ?? null,
        JSON.stringify(data.requirements ?? []),
        data.status ?? 'DRAFT',
        data.challenge_number ?? null,
      ]
    );
    const row = result.rows[0];
    return {
      ...row,
      requirements: Array.isArray(row.requirements) ? row.requirements : [],
    };
  },

  async update(id: string, data: Record<string, unknown>): Promise<Challenge | null> {
    const fields: string[] = [];
    const params: unknown[] = [id];
    let i = 2;
    const allowed = [
      'title', 'slug', 'description', 'difficulty', 'scenario',
      'requirements', 'status', 'challenge_number',
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        if (key === 'requirements') {
          fields.push(`requirements = $${i++}::jsonb`);
          params.push(JSON.stringify(data[key]));
        } else {
          fields.push(`${key} = $${i++}`);
          params.push(data[key]);
        }
      }
    }
    if (!fields.length) return this.findById(id);
    const result = await query<Challenge>(
      `UPDATE challenges SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      requirements: Array.isArray(row.requirements) ? row.requirements : [],
    };
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM challenges WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async setOptions(
    challengeId: string,
    options: {
      title: string;
      description?: string | null;
      is_correct?: boolean;
      explanation?: string | null;
      display_order?: number;
    }[]
  ): Promise<ChallengeOption[]> {
    await query('DELETE FROM challenge_options WHERE challenge_id = $1', [challengeId]);
    const created: ChallengeOption[] = [];
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const result = await query<ChallengeOption>(
        `INSERT INTO challenge_options (challenge_id, title, description, is_correct, explanation, display_order)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          challengeId,
          opt.title,
          opt.description ?? null,
          opt.is_correct ?? false,
          opt.explanation ?? null,
          opt.display_order ?? i,
        ]
      );
      created.push(result.rows[0]);
    }
    return created;
  },
};
