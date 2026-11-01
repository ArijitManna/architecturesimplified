import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { ValidationError } from '../utils/errors.js';

const ALLOWED_MIME: Record<string, string[]> = {
  images: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
  diagrams: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'text/html', 'image/svg+xml'],
  resources: [
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/json',
  ],
};

const EXT_MAP: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'text/html': '.html',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'application/json': '.json',
};

export type StorageFolder = 'diagrams' | 'resources' | 'images';

/**
 * Local filesystem storage. Designed so the implementation can later
 * be swapped for AWS S3 without changing callers or DB schema.
 */
export class StorageService {
  private root: string;

  constructor(root = env.uploadDir) {
    this.root = root;
  }

  async ensureFolders(): Promise<void> {
    for (const folder of ['diagrams', 'resources', 'images'] as StorageFolder[]) {
      await fs.mkdir(path.join(this.root, folder), { recursive: true });
    }
  }

  async save(
    folder: StorageFolder,
    file: Express.Multer.File
  ): Promise<{ filePath: string; absolutePath: string }> {
    const allowed = ALLOWED_MIME[folder] || ALLOWED_MIME.images;
    if (!allowed.includes(file.mimetype)) {
      throw new ValidationError(`File type ${file.mimetype} is not allowed`);
    }

    const maxBytes = env.maxUploadSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new ValidationError(`File exceeds ${env.maxUploadSizeMb}MB limit`);
    }

    const ext = EXT_MAP[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.bin';
    const safeName = `${randomUUID()}${ext}`;
    const absolutePath = path.join(this.root, folder, safeName);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    // Store relative path for DB (portable across storage backends later)
    const filePath = `${folder}/${safeName}`;
    return { filePath, absolutePath };
  }

  resolveAbsolute(relativePath: string): string {
    const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolute = path.join(this.root, normalized);
    if (!absolute.startsWith(this.root)) {
      throw new ValidationError('Invalid file path');
    }
    return absolute;
  }

  async delete(relativePath: string | null | undefined): Promise<void> {
    if (!relativePath) return;
    try {
      await fs.unlink(this.resolveAbsolute(relativePath));
    } catch {
      // ignore missing files
    }
  }

  /**
   * Sanitize SVG content — strip script tags and event handlers.
   */
  sanitizeSvg(content: string): string {
    return content
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript:/gi, '');
  }

  /**
   * For HTML diagrams — strip scripts and dangerous attributes.
   * Do NOT execute arbitrary uploaded JavaScript.
   */
  sanitizeHtml(content: string): string {
    return content
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
      .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
      .replace(/<embed[\s\S]*?>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript:/gi, '');
  }
}

export const storageService = new StorageService();
