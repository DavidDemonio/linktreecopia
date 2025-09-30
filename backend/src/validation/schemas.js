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

const colorStringSchema = z
  .string()
  .trim()
  .min(1, 'Color requerido')
  .max(100, 'Color demasiado largo');

const designBackgroundSchema = z
  .object({
    mode: z.enum(['gradient', 'image', 'color']).optional(),
    angle: z.number().min(0).max(360).optional(),
    colors: z.array(colorStringSchema).min(1).max(6).optional(),
    image: z.string().trim().max(1024).optional().nullable(),
    overlayOpacity: z.number().min(0).max(1).optional(),
    noiseOpacity: z.number().min(0).max(1).optional()
  })
  .partial();

const designProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(120).optional(),
    bio: z.string().trim().max(400).optional().nullable(),
    avatar: z.string().trim().max(1024).optional().nullable(),
    highlight: z.string().trim().max(160).optional().nullable(),
    socialHandle: z.string().trim().max(120).optional().nullable()
  })
  .partial();

const designLinkStyleSchema = z
  .object({
    borderRadius: z.number().min(0).max(64).optional(),
    transparency: z.number().min(0).max(1).optional(),
    gradientStrength: z.number().min(0).max(1).optional(),
    textColor: colorStringSchema.optional(),
    accentColor: colorStringSchema.optional(),
    glow: z.boolean().optional()
  })
  .partial();

const designLayoutSchema = z
  .object({
    alignment: z.enum(['left', 'center', 'right']).optional(),
    sectionOrder: z.array(z.enum(['profile', 'filters', 'links'])).min(1).optional(),
    showSearch: z.boolean().optional(),
    showCategories: z.boolean().optional(),
    linkStyle: designLinkStyleSchema.optional()
  })
  .partial();

const designPaletteSchema = z
  .object({
    text: colorStringSchema.optional(),
    textMuted: colorStringSchema.optional(),
    surface: z.string().trim().min(1).max(120).optional(),
    glass: z.string().trim().min(1).max(120).optional()
  })
  .partial();

export const updateDesignSchema = z
  .object({
    background: designBackgroundSchema.optional(),
    profile: designProfileSchema.optional(),
    layout: designLayoutSchema.optional(),
    palette: designPaletteSchema.optional()
  })
  .partial();

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
