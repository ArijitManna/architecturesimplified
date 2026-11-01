import type { Request, Response } from 'express';
import { z } from 'zod';
import { challengeRepository } from '../repositories/challenge.repository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { toSlug } from '../utils/slug.js';

const challengeSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  scenario: z.string().optional().nullable(),
  requirements: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  challenge_number: z.coerce.number().int().optional().nullable(),
  options: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        is_correct: z.boolean().optional(),
        explanation: z.string().optional().nullable(),
        display_order: z.number().int().optional(),
      })
    )
    .optional(),
});

export const challengeController = {
  async listPublic(_req: Request, res: Response) {
    const challenges = await challengeRepository.findAll(true);
    res.json({ challenges });
  },

  async getBySlug(req: Request, res: Response) {
    const challenge = await challengeRepository.findBySlug(req.params.slug!);
    if (!challenge || challenge.status !== 'PUBLISHED') throw new NotFoundError('Challenge');
    const options = await challengeRepository.findOptions(challenge.id, false);
    res.json({ challenge, options });
  },

  async submit(req: Request, res: Response) {
    const challenge = await challengeRepository.findBySlug(req.params.slug!);
    if (!challenge || challenge.status !== 'PUBLISHED') throw new NotFoundError('Challenge');

    const body = z.object({ option_id: z.string().uuid() }).parse(req.body);
    const options = await challengeRepository.findOptionsFull(challenge.id);
    const selected = options.find((o) => o.id === body.option_id);
    if (!selected) throw new ValidationError('Invalid option');

    res.json({
      correct: selected.is_correct,
      explanation: selected.explanation,
      selected_option_id: selected.id,
      correct_option_ids: options.filter((o) => o.is_correct).map((o) => o.id),
    });
  },

  async listAdmin(_req: Request, res: Response) {
    const challenges = await challengeRepository.findAll(false);
    res.json({ challenges });
  },

  async getAdmin(req: Request, res: Response) {
    const challenge = await challengeRepository.findById(req.params.id!);
    if (!challenge) throw new NotFoundError('Challenge');
    const options = await challengeRepository.findOptionsFull(challenge.id);
    res.json({ challenge, options });
  },

  async create(req: Request, res: Response) {
    const body = challengeSchema.parse(req.body);
    const slug = body.slug || toSlug(body.title);
    const challenge = await challengeRepository.create({ ...body, slug });
    let options = [];
    if (body.options) {
      options = await challengeRepository.setOptions(challenge.id, body.options);
    }
    res.status(201).json({ challenge, options });
  },

  async update(req: Request, res: Response) {
    const existing = await challengeRepository.findById(req.params.id!);
    if (!existing) throw new NotFoundError('Challenge');
    const body = challengeSchema.partial().parse(req.body);
    const { options, ...rest } = body;
    const data = { ...rest };
    if (rest.title && !rest.slug) data.slug = toSlug(rest.title);
    const challenge = await challengeRepository.update(req.params.id!, data);
    let opts = await challengeRepository.findOptionsFull(req.params.id!);
    if (options) {
      opts = await challengeRepository.setOptions(req.params.id!, options);
    }
    res.json({ challenge, options: opts });
  },

  async remove(req: Request, res: Response) {
    const ok = await challengeRepository.delete(req.params.id!);
    if (!ok) throw new NotFoundError('Challenge');
    res.status(204).send();
  },
};
