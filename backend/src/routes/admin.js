import express from 'express';
import {
  getLinks,
  createLink,
  updateLink,
  deleteLink,
  reorderLinks,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getStats
} from '../data/repositories.js';
import { validate, createLinkSchema, updateLinkSchema, reorderLinksSchema, createCategorySchema, updateCategorySchema, loginSchema } from '../validation/schemas.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/env.js';

const router = express.Router();

router.post('/login', (req, res, next) => {
  try {
    const body = validate(loginSchema, req.body || {});
    if (body.user !== config.adminUser || body.pass !== config.adminPass) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Usuario o contraseña incorrectos.'
        }
      });
    }
    req.session.user = {
      username: config.adminUser,
      loggedInAt: new Date().toISOString()
    };
    res.json({
      data: {
        user: req.session.user
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', requireAuth, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('connect.sid');
    res.json({ data: { success: true } });
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ data: req.session.user });
});

router.get('/csrf', (req, res) => {
  res.json({ data: { token: req.csrfToken() } });
});

router.get('/links', requireAuth, async (req, res, next) => {
  try {
    const links = await getLinks();
    res.json({ data: links });
  } catch (error) {
    next(error);
  }
});

router.post('/links', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(createLinkSchema, req.body || {});
    const links = await getLinks();
    if (links.some((link) => link.slug === payload.slug)) {
      return res.status(409).json({
        error: {
          code: 'SLUG_IN_USE',
          message: 'El slug ya está en uso.'
        }
      });
    }
    const categories = await getCategories();
    const categorySlugs = new Set(categories.map((c) => c.slug));
    payload.categories = (payload.categories || []).filter((slug) => categorySlugs.has(slug));
    const link = await createLink(payload);
    res.status(201).json({ data: link });
  } catch (error) {
    next(error);
  }
});

router.put('/links/:id', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(updateLinkSchema, req.body || {});
    const links = await getLinks();
    const linkId = req.params.id;
    if (payload.slug && links.some((link) => link.slug === payload.slug && link.id !== linkId)) {
      return res.status(409).json({
        error: {
          code: 'SLUG_IN_USE',
          message: 'El slug ya está en uso.'
        }
      });
    }
    if (payload.categories) {
      const categories = await getCategories();
      const categorySlugs = new Set(categories.map((c) => c.slug));
      payload.categories = payload.categories.filter((slug) => categorySlugs.has(slug));
    }
    const updated = await updateLink(linkId, payload);
    if (!updated) {
      return res.status(404).json({
        error: {
          code: 'LINK_NOT_FOUND',
          message: 'Enlace no encontrado.'
        }
      });
    }
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/links/:id', requireAuth, async (req, res, next) => {
  try {
    const removed = await deleteLink(req.params.id);
    if (!removed) {
      return res.status(404).json({
        error: {
          code: 'LINK_NOT_FOUND',
          message: 'Enlace no encontrado.'
        }
      });
    }
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

router.patch('/links/reorder', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(reorderLinksSchema, req.body || {});
    const reordered = await reorderLinks(payload.ids);
    res.json({ data: reordered });
  } catch (error) {
    next(error);
  }
});

router.get('/categories', requireAuth, async (req, res, next) => {
  try {
    const categories = await getCategories();
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
});

router.post('/categories', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(createCategorySchema, req.body || {});
    const categories = await getCategories();
    if (categories.some((category) => category.slug === payload.slug)) {
      return res.status(409).json({
        error: {
          code: 'SLUG_IN_USE',
          message: 'El slug ya está en uso.'
        }
      });
    }
    const category = await createCategory(payload);
    res.status(201).json({ data: category });
  } catch (error) {
    next(error);
  }
});

router.put('/categories/:id', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(updateCategorySchema, req.body || {});
    const categories = await getCategories();
    const categoryId = req.params.id;
    if (payload.slug && categories.some((category) => category.slug === payload.slug && category.id !== categoryId)) {
      return res.status(409).json({
        error: {
          code: 'SLUG_IN_USE',
          message: 'El slug ya está en uso.'
        }
      });
    }
    const updated = await updateCategory(categoryId, payload);
    if (!updated) {
      return res.status(404).json({
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Categoría no encontrada.'
        }
      });
    }
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/categories/:id', requireAuth, async (req, res, next) => {
  try {
    const removed = await deleteCategory(req.params.id);
    if (!removed) {
      return res.status(404).json({
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Categoría no encontrada.'
        }
      });
    }
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/links/:id', requireAuth, async (req, res, next) => {
  try {
    const stats = await getStats();
    const linkStats = stats[req.params.id];
    const range = req.query.range || '7d';
    if (!linkStats) {
      return res.json({ data: { totalClicks: 0, daily: [] } });
    }
    const days = Object.entries(linkStats.daily || {}).map(([date, day]) => ({
      date,
      total: day.total || 0,
      uniques: day.uniqueCount ?? (Array.isArray(day.uniques) ? day.uniques.length : 0)
    }));
    days.sort((a, b) => (a.date < b.date ? -1 : 1));

    const now = new Date();
    let filtered = days;
    if (range === '7d' || range === '30d') {
      const limitDays = range === '7d' ? 7 : 30;
      const cutoff = new Date(now.getTime() - (limitDays - 1) * 86400000);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      filtered = days.filter((day) => day.date >= cutoffStr);
    }

    res.json({
      data: {
        totalClicks: linkStats.totalClicks || 0,
        daily: filtered
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
