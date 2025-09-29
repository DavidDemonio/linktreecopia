import crypto from 'crypto';
import { config } from '../config/env.js';

export function createFingerprint(req) {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip;
  const userAgent = req.headers['user-agent'] || '';
  const date = new Date().toISOString().slice(0, 10);
  const value = `${ip}|${userAgent}|${date}|${config.hashSalt}`;
  return crypto.createHash('sha256').update(value).digest('hex');
}
