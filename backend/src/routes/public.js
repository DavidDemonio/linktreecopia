import express from 'express';
import { getLinks, getCategories, recordClick } from '../data/repositories.js';
import { redirectRateLimiter } from '../middleware/rateLimit.js';
import { createFingerprint } from '../utils/fingerprint.js';

const router = express.Router();

router.get('/links', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const links = await getLinks();
    const filtered = links
      .filter((link) => link.active)
      .filter((link) => {
        if (!category) return true;
        return link.categories?.includes(category);
      })
      .filter((link) => {
        if (!search) return true;
        const term = search.toString().toLowerCase();
        return (
          link.title.toLowerCase().includes(term) ||
          (link.description || '').toLowerCase().includes(term) ||
          link.slug.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => a.order - b.order);
    res.json({ data: filtered });
  } catch (error) {
    next(error);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await getCategories();
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
});

router.get('/go/:slug', redirectRateLimiter, async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const links = await getLinks();
    const link = links.find((item) => item.slug === slug && item.active);
    if (!link) {
      return res.status(404).json({
        error: {
          code: 'LINK_NOT_FOUND',
          message: 'Enlace no encontrado o inactivo.'
        }
      });
    }
    const fingerprint = createFingerprint(req);
    await recordClick(link.id, fingerprint);
    res.redirect(302, link.url);
  } catch (error) {
    next(error);
  }
});

export default router;
