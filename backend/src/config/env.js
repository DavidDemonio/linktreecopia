import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPass: process.env.ADMIN_PASS || 'admin123',
  sessionSecret: process.env.SESSION_SECRET || 'supersecret',
  env: process.env.NODE_ENV || 'development',
  hashSalt: process.env.HASH_SALT || process.env.SESSION_SECRET || 'supersecret',
  sessionCookieSecure:
    (process.env.SESSION_COOKIE_SECURE || 'false').toLowerCase() === 'true'
};
