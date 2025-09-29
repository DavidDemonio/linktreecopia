import { z } from 'zod';
import { isValidSlug } from '../utils/slug.js';
import { isValidUrl, normalizeUrl } from '../utils/url.js';

const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug requerido')
  .max(64, 'Slug demasiado largo')
  .refine((value) => isValidSlug(value), {
    message: 'El slug solo puede contener letras, números y guiones.'
  })
  .transform((value) => value.toLowerCase());

const urlSchema = z
  .string()
  .trim()
  .min(1, 'URL requerida')
  .transform((value) => normalizeUrl(value))
  .refine((value) => isValidUrl(value), {
    message: 'Debe ser una URL https válida (localhost permitido).'
  });

const linkBaseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  url: urlSchema,
  slug: slugSchema,
  description: z.string().trim().max(400).optional().nullable(),
  icon: z.string().trim().max(80).optional().nullable(),
  categories: z.array(z.string().trim()).optional(),
  active: z.boolean().optional(),
  order: z.number().int().min(0).optional()
});

export const createLinkSchema = linkBaseSchema;

export const updateLinkSchema = linkBaseSchema.partial();

export const reorderLinksSchema = z.object({
  ids: z.array(z.string().uuid())
});

const categoryBaseSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: slugSchema,
  color: z
    .string()
    .trim()
    .regex(/^#?[0-9A-Fa-f]{6}$/i, 'Color debe estar en formato hex (#RRGGBB).')
    .transform((value) => (value.startsWith('#') ? value : `#${value}`))
    .optional()
    .nullable()
});

export const createCategorySchema = categoryBaseSchema;
export const updateCategorySchema = categoryBaseSchema.partial();

export const loginSchema = z.object({
  user: z.string().min(1),
  pass: z.string().min(1)
});

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.') || 'root',
      message: issue.message
    }));
    const error = new Error('ValidationError');
    error.status = 422;
    error.details = details;
    throw error;
  }
  return result.data;
}
