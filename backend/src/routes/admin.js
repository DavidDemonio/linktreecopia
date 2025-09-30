import express from 'express';
import multer from 'multer';
import path from 'path';
import { randomBytes } from 'crypto';
import fs from 'fs/promises';
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
  getStats,
  getDesign,
  updateDesign
} from '../data/repositories.js';
import {
  validate,
  createLinkSchema,
  updateLinkSchema,
  reorderLinksSchema,
  createCategorySchema,
  updateCategorySchema,
  loginSchema,
  updateDesignSchema
} from '../validation/schemas.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/env.js';
import { getCountryName } from '../utils/analytics.js';
import { resolveDataPath } from '../data/storage.js';

const uploadDir = resolveDataPath('uploads');

const imageUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      fs.mkdir(uploadDir, { recursive: true })
        .then(() => cb(null, uploadDir))
        .catch((error) => cb(error));
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const name = randomBytes(12).toString('hex');
      cb(null, `${Date.now()}-${name}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new Error('Solo se permiten imágenes.'));
    }
    cb(null, true);
  }
});

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

router.get('/design', requireAuth, async (req, res, next) => {
  try {
    const design = await getDesign();
    res.json({ data: design });
  } catch (error) {
    next(error);
  }
});

router.put('/design', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(updateDesignSchema, req.body || {});
    const updated = await updateDesign(payload);
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

router.post('/uploads', requireAuth, (req, res, next) => {
  imageUpload.single('file')(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError || error.message) {
        return res.status(400).json({
          error: {
            code: 'UPLOAD_FAILED',
            message: error.message || 'No se pudo subir el archivo.'
          }
        });
      }
      return next(error);
    }
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'NO_FILE',
          message: 'No se envió ningún archivo.'
        }
      });
    }
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({
      data: {
        url,
        filename: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  });
});

router.get('/stats/links/:id', requireAuth, async (req, res, next) => {
  try {
    const stats = await getStats();
    const linkStats = stats[req.params.id];
    const range = req.query.range || '7d';
    if (!linkStats) {
      return res.json({ data: { totalClicks: 0, daily: [], countries: [], referrers: [] } });
    }
    const days = Object.entries(linkStats.daily || {}).map(([date, day]) => ({
      date,
      total: day.total || 0,
      uniques: day.uniqueCount ?? (Array.isArray(day.uniques) ? day.uniques.length : 0),
      raw: day
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

    const aggregateFromObject = (entries = {}) =>
      Object.entries(entries).map(([key, value]) => ({
        key,
        total: value.total || 0,
        uniques:
          value.uniqueCount ?? (Array.isArray(value.uniques) ? value.uniques.length : value.uniques || 0),
        label: value.label || key
      }));

    const aggregateFromDays = (items = []) => {
      const countryBucket = new Map();
      const referrerBucket = new Map();

      items.forEach((item) => {
        const raw = item.raw || {};
        Object.entries(raw.countries || {}).forEach(([code, country]) => {
          const entry = countryBucket.get(code) || { total: 0, uniques: new Set(), fallback: 0 };
          entry.total += country.total || 0;
          if (Array.isArray(country.uniques)) {
            country.uniques.forEach((fingerprint) => entry.uniques.add(fingerprint));
          } else if (typeof country.uniqueCount === 'number') {
            entry.fallback += country.uniqueCount;
          }
          countryBucket.set(code, entry);
        });

        Object.entries(raw.referrers || {}).forEach(([source, referrer]) => {
          const entry =
            referrerBucket.get(source) || {
              total: 0,
              uniques: new Set(),
              fallback: 0,
              label: referrer.label || source
            };
          entry.total += referrer.total || 0;
          if (Array.isArray(referrer.uniques)) {
            referrer.uniques.forEach((fingerprint) => entry.uniques.add(fingerprint));
          } else if (typeof referrer.uniqueCount === 'number') {
            entry.fallback += referrer.uniqueCount;
          }
          entry.label = entry.label || referrer.label || source;
          referrerBucket.set(source, entry);
        });
      });

      const countries = Array.from(countryBucket.entries()).map(([code, value]) => ({
        code,
        total: value.total,
        uniques: value.uniques instanceof Set && value.uniques.size > 0 ? value.uniques.size : value.fallback || 0
      }));

      const referrers = Array.from(referrerBucket.entries()).map(([source, value]) => ({
        source,
        label: value.label || source,
        total: value.total,
        uniques: value.uniques instanceof Set && value.uniques.size > 0 ? value.uniques.size : value.fallback || 0
      }));

      return { countries, referrers };
    };

    let countries;
    let referrers;
    if (range === 'all') {
      const countryAggregates = aggregateFromObject(linkStats.countries || {});
      const referrerAggregates = aggregateFromObject(linkStats.referrers || {});
      countries = countryAggregates.map((entry) => ({
        code: entry.key,
        name: getCountryName(entry.key),
        total: entry.total,
        uniques: entry.uniques
      }));
      referrers = referrerAggregates.map((entry) => ({
        source: entry.key,
        label: entry.label || entry.key,
        total: entry.total,
        uniques: entry.uniques
      }));
    } else {
      const aggregates = aggregateFromDays(filtered);
      countries = aggregates.countries.map((entry) => ({
        code: entry.code,
        name: getCountryName(entry.code),
        total: entry.total,
        uniques: entry.uniques
      }));
      referrers = aggregates.referrers;
    }

    countries.sort((a, b) => b.total - a.total);
    referrers.sort((a, b) => b.total - a.total);

    res.json({
      data: {
        totalClicks: linkStats.totalClicks || 0,
        daily: filtered.map(({ raw, ...rest }) => rest),
        countries,
        referrers
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
