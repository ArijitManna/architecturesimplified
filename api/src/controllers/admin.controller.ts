import type { Request, Response } from 'express';
import { categoryRepository } from '../repositories/category.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { diagramRepository } from '../repositories/diagram.repository.js';
import { resourceRepository } from '../repositories/resource.repository.js';

export const adminController = {
  async dashboard(_req: Request, res: Response) {
    const [categories, topics, published, drafts, diagrams, resources] = await Promise.all([
      categoryRepository.count(),
      topicRepository.count(),
      topicRepository.count('PUBLISHED'),
      topicRepository.count('DRAFT'),
      diagramRepository.count(),
      resourceRepository.count(),
    ]);

    res.json({
      stats: {
        total_categories: categories,
        total_topics: topics,
        published_topics: published,
        draft_topics: drafts,
        total_diagrams: diagrams,
        total_resources: resources,
      },
    });
  },
};
