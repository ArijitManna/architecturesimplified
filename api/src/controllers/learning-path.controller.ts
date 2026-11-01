import type { Request, Response } from 'express';
import { z } from 'zod';
import { learningPathRepository } from '../repositories/learning-path.repository.js';
import { NotFoundError } from '../utils/errors.js';
import { toSlug } from '../utils/slug.js';

const pathSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  cover_image: z.string().optional().nullable(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  display_order: z.coerce.number().int().optional(),
  is_active: z.coerce.boolean().optional(),
  topics: z
    .array(
      z.object({
        topic_id: z.string().uuid(),
        display_order: z.number().int(),
        is_required: z.boolean().optional(),
      })
    )
    .optional(),
});

export const learningPathController = {
  async listPublic(_req: Request, res: Response) {
    const paths = await learningPathRepository.findAll(true);
    res.json({ learning_paths: paths });
  },

  async getBySlug(req: Request, res: Response) {
    const path = await learningPathRepository.findBySlug(req.params.slug!);
    if (!path || !path.is_active) throw new NotFoundError('Learning path');
    const topics = await learningPathRepository.findTopics(path.id);
    res.json({ learning_path: path, topics });
  },

  async listAdmin(_req: Request, res: Response) {
    const paths = await learningPathRepository.findAll(false);
    res.json({ learning_paths: paths });
  },

  async getAdmin(req: Request, res: Response) {
    const path = await learningPathRepository.findById(req.params.id!);
    if (!path) throw new NotFoundError('Learning path');
    const topics = await learningPathRepository.findTopics(path.id);
    res.json({ learning_path: path, topics });
  },

  async create(req: Request, res: Response) {
    const body = pathSchema.parse(req.body);
    const slug = body.slug || toSlug(body.title);
    const path = await learningPathRepository.create({ ...body, slug });
    if (body.topics) {
      await learningPathRepository.setTopics(path.id, body.topics);
    }
    const topics = await learningPathRepository.findTopics(path.id);
    res.status(201).json({ learning_path: path, topics });
  },

  async update(req: Request, res: Response) {
    const existing = await learningPathRepository.findById(req.params.id!);
    if (!existing) throw new NotFoundError('Learning path');
    const body = pathSchema.partial().parse(req.body);
    const { topics, ...rest } = body;
    const data = { ...rest };
    if (rest.title && !rest.slug) data.slug = toSlug(rest.title);
    const path = await learningPathRepository.update(req.params.id!, data);
    if (topics) {
      await learningPathRepository.setTopics(req.params.id!, topics);
    }
    const pathTopics = await learningPathRepository.findTopics(req.params.id!);
    res.json({ learning_path: path, topics: pathTopics });
  },

  async remove(req: Request, res: Response) {
    const ok = await learningPathRepository.delete(req.params.id!);
    if (!ok) throw new NotFoundError('Learning path');
    res.status(204).send();
  },
};
