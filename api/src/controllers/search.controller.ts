import type { Request, Response } from 'express';
import { searchService } from '../services/search.service.js';

export const searchController = {
  async search(req: Request, res: Response) {
    const q = String(req.query.q || '');
    const results = await searchService.search(q);
    res.json({ query: q, ...results });
  },
};
