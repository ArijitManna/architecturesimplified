import type { Request, Response } from 'express';
import { z } from 'zod';
import { sectionRepository } from '../repositories/section.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { NotFoundError } from '../utils/errors.js';

const sectionSchema = z.object({
  section_type: z.enum([
    'MENTAL_MODEL', 'INTRODUCTION', 'ARCHITECTURE', 'CONCEPT',
    'DEEP_DIVE', 'SCENARIO', 'EXAM_TIP', 'KEY_TAKEAWAY', 'CUSTOM',
  ]),
  title: z.string().min(1).max(255),
  subtitle: z.string().optional().nullable(),
  content: z.string().optional(),
  display_order: z.coerce.number().int().optional(),
  is_active: z.coerce.boolean().optional(),
});

export const sectionController = {
  async create(req: Request, res: Response) {
    const topic = await topicRepository.findById(req.params.id!);
    if (!topic) throw new NotFoundError('Topic');
    const body = sectionSchema.parse(req.body);
    const section = await sectionRepository.create({
      topic_id: topic.id,
      ...body,
    });
    res.status(201).json({ section });
  },

  async update(req: Request, res: Response) {
    const existing = await sectionRepository.findById(req.params.id!);
    if (!existing) throw new NotFoundError('Section');
    const body = sectionSchema.partial().parse(req.body);
    const section = await sectionRepository.update(req.params.id!, body);
    res.json({ section });
  },

  async remove(req: Request, res: Response) {
    const ok = await sectionRepository.delete(req.params.id!);
    if (!ok) throw new NotFoundError('Section');
    res.status(204).send();
  },
};
