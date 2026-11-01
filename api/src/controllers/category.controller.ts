import type { Request, Response } from 'express';
import { z } from 'zod';
import { categoryRepository } from '../repositories/category.repository.js';
import { NotFoundError } from '../utils/errors.js';
import { toSlug } from '../utils/slug.js';
import { storageService } from '../services/storage.service.js';

const categorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  cover_image: z.string().optional().nullable(),
  display_order: z.coerce.number().int().optional(),
  is_active: z.coerce.boolean().optional(),
});

export const categoryController = {
  async listPublic(_req: Request, res: Response) {
    const categories = await categoryRepository.findAll({ activeOnly: true });
    res.json({ categories });
  },

  async getBySlug(req: Request, res: Response) {
    const category = await categoryRepository.findBySlug(req.params.slug!);
    if (!category || !category.is_active) throw new NotFoundError('Category');
    res.json({ category });
  },

  async listAdmin(_req: Request, res: Response) {
    const categories = await categoryRepository.findAll();
    res.json({ categories });
  },

  async create(req: Request, res: Response) {
    const body = categorySchema.parse(req.body);
    const slug = body.slug || toSlug(body.name);
    let icon = body.icon ?? null;
    let cover_image = body.cover_image ?? null;

    if (req.files && typeof req.files === 'object') {
      const files = req.files as { [field: string]: Express.Multer.File[] };
      if (files.icon?.[0]) {
        const saved = await storageService.save('images', files.icon[0]);
        icon = saved.filePath;
      }
      if (files.cover_image?.[0]) {
        const saved = await storageService.save('images', files.cover_image[0]);
        cover_image = saved.filePath;
      }
    }

    const category = await categoryRepository.create({
      ...body,
      slug,
      icon,
      cover_image,
    });
    res.status(201).json({ category });
  },

  async update(req: Request, res: Response) {
    const existing = await categoryRepository.findById(req.params.id!);
    if (!existing) throw new NotFoundError('Category');

    const body = categorySchema.partial().parse(req.body);
    const data: Record<string, unknown> = { ...body };
    if (body.name && !body.slug) data.slug = toSlug(body.name);

    if (req.files && typeof req.files === 'object') {
      const files = req.files as { [field: string]: Express.Multer.File[] };
      if (files.icon?.[0]) {
        const saved = await storageService.save('images', files.icon[0]);
        data.icon = saved.filePath;
      }
      if (files.cover_image?.[0]) {
        const saved = await storageService.save('images', files.cover_image[0]);
        data.cover_image = saved.filePath;
      }
    }

    const category = await categoryRepository.update(req.params.id!, data as Partial<typeof existing>);
    res.json({ category });
  },

  async remove(req: Request, res: Response) {
    const ok = await categoryRepository.delete(req.params.id!);
    if (!ok) throw new NotFoundError('Category');
    res.status(204).send();
  },
};
