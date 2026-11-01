import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://architect:architect@localhost:5432/architecture_simplified',
  apiPort: parseInt(process.env.API_PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.resolve(__dirname, '../../../uploads')),
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@architecturesimplified.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@12345',
  adminName: process.env.ADMIN_NAME || 'Platform Admin',
  nodeEnv: process.env.NODE_ENV || 'development',
};
