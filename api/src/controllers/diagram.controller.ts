import type { Request, Response } from 'express';
import { z } from 'zod';
import { diagramRepository } from '../repositories/diagram.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { storageService } from '../services/storage.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const diagramSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  diagram_type: z.enum(['IMAGE', 'SVG', 'HTML']).optional(),
  display_order: z.coerce.number().int().optional(),
  is_interactive: z.coerce.boolean().optional(),
});

export const diagramController = {
  async create(req: Request, res: Response) {
    const topic = await topicRepository.findById(req.params.id!);
    if (!topic) throw new NotFoundError('Topic');

    const body = diagramSchema.parse(req.body);
    let file_path: string | null = null;
    let diagram_type = body.diagram_type || 'IMAGE';

    if (req.file) {
      const saved = await storageService.save('diagrams', req.file);
      file_path = saved.filePath;

      if (req.file.mimetype === 'image/svg+xml') {
        diagram_type = 'SVG';
        const content = storageService.sanitizeSvg(req.file.buffer.toString('utf-8'));
        await import('fs/promises').then((fs) =>
          fs.writeFile(saved.absolutePath, content, 'utf-8')
        );
      } else if (req.file.mimetype === 'text/html') {
        diagram_type = 'HTML';
        const content = storageService.sanitizeHtml(req.file.buffer.toString('utf-8'));
        await import('fs/promises').then((fs) =>
          fs.writeFile(saved.absolutePath, content, 'utf-8')
        );
      }
    }

    const diagram = await diagramRepository.create({
      topic_id: topic.id,
      title: body.title,
      description: body.description,
      diagram_type,
      file_path,
      display_order: body.display_order,
      is_interactive: body.is_interactive ?? diagram_type === 'HTML',
    });

    res.status(201).json({ diagram });
  },

  async update(req: Request, res: Response) {
    const existing = await diagramRepository.findById(req.params.id!);
    if (!existing) throw new NotFoundError('Diagram');

    const body = diagramSchema.partial().parse(req.body);
    const data: Record<string, unknown> = { ...body };

    if (req.file) {
      const saved = await storageService.save('diagrams', req.file);
      data.file_path = saved.filePath;
      if (existing.file_path) await storageService.delete(existing.file_path);

      if (req.file.mimetype === 'image/svg+xml') {
        data.diagram_type = 'SVG';
        const content = storageService.sanitizeSvg(req.file.buffer.toString('utf-8'));
        await import('fs/promises').then((fs) =>
          fs.writeFile(saved.absolutePath, content, 'utf-8')
        );
      } else if (req.file.mimetype === 'text/html') {
        data.diagram_type = 'HTML';
        data.is_interactive = true;
        const content = storageService.sanitizeHtml(req.file.buffer.toString('utf-8'));
        await import('fs/promises').then((fs) =>
          fs.writeFile(saved.absolutePath, content, 'utf-8')
        );
      } else {
        data.diagram_type = body.diagram_type || 'IMAGE';
      }
    }

    const diagram = await diagramRepository.update(req.params.id!, data as never);
    res.json({ diagram });
  },

  async remove(req: Request, res: Response) {
    const existing = await diagramRepository.findById(req.params.id!);
    if (!existing) throw new NotFoundError('Diagram');
    await storageService.delete(existing.file_path);
    await diagramRepository.delete(req.params.id!);
    res.status(204).send();
  },

  async createPlaceholder(_req: Request, _res: Response) {
    throw new ValidationError('Use multipart upload with a file or create via seed');
  },
};
