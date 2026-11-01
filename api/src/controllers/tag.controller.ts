import type { Request, Response } from 'express';
import { tagRepository } from '../repositories/tag.repository.js';

export const tagController = {
  async list(_req: Request, res: Response) {
    const tags = await tagRepository.findAll();
    res.json({ tags });
  },
};
