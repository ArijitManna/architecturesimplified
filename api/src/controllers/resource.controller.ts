import type { Request, Response } from 'express';
import { z } from 'zod';
import { resourceRepository } from '../repositories/resource.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { storageService } from '../services/storage.service.js';
import { NotFoundError } from '../utils/errors.js';

const resourceSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  resource_type: z
    .enum(['OFFICIAL_DOC', 'VIDEO', 'ARTICLE', 'PDF', 'GITHUB', 'CHEAT_SHEET', 'REFERENCE', 'OTHER'])
    .optional(),
  url: z.string().url().optional().nullable().or(z.literal('')),
  display_order: z.coerce.number().int().optional(),
  is_external: z.coerce.boolean().optional(),
});

export const resourceController = {
  async create(req: Request, res: Response) {
    const topic = await topicRepository.findById(req.params.id!);
    if (!topic) throw new NotFoundError('Topic');
    const body = resourceSchema.parse(req.body);

    let file_path: string | null = null;
    if (req.file) {
      const saved = await storageService.save('resources', req.file);
      file_path = saved.filePath;
    }

    const resource = await resourceRepository.create({
      topic_id: topic.id,
      title: body.title,
      description: body.description,
      resource_type: body.resource_type,
      url: body.url || null,
      file_path,
      display_order: body.display_order,
      is_external: body.is_external ?? !file_path,
    });
    res.status(201).json({ resource });
  },

  async update(req: Request, res: Response) {
    const existing = await resourceRepository.findById(req.params.id!);
    if (!existing) throw new NotFoundError('Resource');
    const body = resourceSchema.partial().parse(req.body);
    const data: Record<string, unknown> = { ...body };
    if (body.url === '') data.url = null;

    if (req.file) {
      const saved = await storageService.save('resources', req.file);
      data.file_path = saved.filePath;
      data.is_external = false;
      if (existing.file_path) await storageService.delete(existing.file_path);
    }

    const resource = await resourceRepository.update(req.params.id!, data as never);
    res.json({ resource });
  },

  async remove(req: Request, res: Response) {
    const existing = await resourceRepository.findById(req.params.id!);
    if (!existing) throw new NotFoundError('Resource');
    await storageService.delete(existing.file_path);
    await resourceRepository.delete(req.params.id!);
    res.status(204).send();
  },
};
