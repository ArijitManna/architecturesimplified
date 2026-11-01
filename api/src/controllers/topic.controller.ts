import type { Request, Response } from 'express';
import { z } from 'zod';
import { topicRepository } from '../repositories/topic.repository.js';
import { sectionRepository } from '../repositories/section.repository.js';
import { diagramRepository } from '../repositories/diagram.repository.js';
import { resourceRepository } from '../repositories/resource.repository.js';
import { tagRepository } from '../repositories/tag.repository.js';
import { NotFoundError } from '../utils/errors.js';
import { toSlug } from '../utils/slug.js';
import type { TopicStatus } from '../types/index.js';

const topicSchema = z.object({
  category_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  short_description: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  cover_image: z.string().optional().nullable(),
  topic_number: z.coerce.number().int().optional().nullable(),
  reading_time: z.coerce.number().int().optional().nullable(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  display_order: z.coerce.number().int().optional(),
  tags: z.array(z.string()).optional(),
});

export const topicController = {
  async listPublic(req: Request, res: Response) {
    const categorySlug = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

    const topics = await topicRepository.findAll({
      categorySlug,
      status: 'PUBLISHED',
      search,
      limit,
    });
    res.json({ topics });
  },

  async getByPath(req: Request, res: Response) {
    const categorySlug = req.params.categorySlug!;
    const topicSlug = req.params.topicSlug!;
    const topic = await topicRepository.findBySlug(categorySlug, topicSlug);
    if (!topic || topic.status !== 'PUBLISHED') throw new NotFoundError('Topic');

    const [sections, diagrams, resources, related] = await Promise.all([
      sectionRepository.findByTopic(topic.id, true),
      diagramRepository.findByTopic(topic.id),
      resourceRepository.findByTopic(topic.id),
      topicRepository.findRelated(topic.id, topic.category_id),
    ]);

    res.json({ topic, sections, diagrams, resources, related });
  },

  async listAdmin(req: Request, res: Response) {
    const status = req.query.status as TopicStatus | undefined;
    const categoryId = req.query.category_id as string | undefined;
    const search = req.query.search as string | undefined;

    const topics = await topicRepository.findAll({
      status,
      categoryId,
      search,
    });
    res.json({ topics });
  },

  async getAdmin(req: Request, res: Response) {
    const topic = await topicRepository.findById(req.params.id!);
    if (!topic) throw new NotFoundError('Topic');

    const [sections, diagrams, resources] = await Promise.all([
      sectionRepository.findByTopic(topic.id),
      diagramRepository.findByTopic(topic.id),
      resourceRepository.findByTopic(topic.id),
    ]);

    res.json({ topic, sections, diagrams, resources });
  },

  async create(req: Request, res: Response) {
    const body = topicSchema.parse(req.body);
    const slug = body.slug || toSlug(body.title);
    const topic = await topicRepository.create({ ...body, slug });

    if (body.tags?.length) {
      const tags = await tagRepository.findByNames(body.tags);
      await topicRepository.setTags(topic.id, tags.map((t) => t.id));
    }

    const full = await topicRepository.findById(topic.id);
    res.status(201).json({ topic: full });
  },

  async update(req: Request, res: Response) {
    const existing = await topicRepository.findById(req.params.id!);
    if (!existing) throw new NotFoundError('Topic');

    const body = topicSchema.partial().parse(req.body);
    const data: Record<string, unknown> = { ...body };
    delete data.tags;

    if (body.title && !body.slug) data.slug = toSlug(body.title);
    if (body.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      data.published_at = new Date();
    }

    await topicRepository.update(req.params.id!, data);

    if (body.tags) {
      const tags = await tagRepository.findByNames(body.tags);
      await topicRepository.setTags(req.params.id!, tags.map((t) => t.id));
    }

    const topic = await topicRepository.findById(req.params.id!);
    res.json({ topic });
  },

  async publish(req: Request, res: Response) {
    const existing = await topicRepository.findById(req.params.id!);
    if (!existing) throw new NotFoundError('Topic');
    const topic = await topicRepository.update(req.params.id!, {
      status: 'PUBLISHED',
      published_at: new Date(),
    });
    res.json({ topic });
  },

  async unpublish(req: Request, res: Response) {
    const existing = await topicRepository.findById(req.params.id!);
    if (!existing) throw new NotFoundError('Topic');
    const topic = await topicRepository.update(req.params.id!, { status: 'DRAFT' });
    res.json({ topic });
  },

  async archive(req: Request, res: Response) {
    const existing = await topicRepository.findById(req.params.id!);
    if (!existing) throw new NotFoundError('Topic');
    const topic = await topicRepository.update(req.params.id!, { status: 'ARCHIVED' });
    res.json({ topic });
  },

  async duplicate(req: Request, res: Response) {
    const topic = await topicRepository.duplicate(req.params.id!);
    if (!topic) throw new NotFoundError('Topic');
    res.status(201).json({ topic });
  },

  async remove(req: Request, res: Response) {
    const ok = await topicRepository.delete(req.params.id!);
    if (!ok) throw new NotFoundError('Topic');
    res.status(204).send();
  },

  async related(req: Request, res: Response) {
    const topic = await topicRepository.findById(req.params.id!);
    if (!topic) throw new NotFoundError('Topic');
    const related = await topicRepository.findRelated(topic.id, topic.category_id);
    res.json({ related });
  },
};
