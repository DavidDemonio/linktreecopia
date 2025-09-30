import express from 'express';
import { redirectRateLimiter } from '../middleware/rateLimit.js';
import { handleRedirect } from './public.js';

const router = express.Router();

router.get('/go/:slug', redirectRateLimiter, handleRedirect);

export default router;
