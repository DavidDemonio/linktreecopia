import { defaultDesign } from '../config/defaultDesign.js';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex) {
  if (!hex) return null;
  const normalized = hex.replace('#', '').trim();
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized.padEnd(6, '0').slice(0, 6);
  const num = Number.parseInt(full, 16);
  if (Number.isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function toRgba(color, alpha = 1) {
  if (!color) return `rgba(255,255,255,${alpha})`;
  if (color.startsWith('rgba') || color.startsWith('rgb') || color.startsWith('hsl')) {
    return color;
  }
  const rgb = hexToRgb(color);
  if (!rgb) {
    return color;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function mixColors(colorA, colorB, weight = 0.5) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  if (!a || !b) {
    return colorA || colorB || '#ffffff';
  }
  const mix = {
    r: Math.round(a.r * (1 - weight) + b.r * weight),
    g: Math.round(a.g * (1 - weight) + b.g * weight),
    b: Math.round(a.b * (1 - weight) + b.b * weight)
  };
  return `#${((1 << 24) + (mix.r << 16) + (mix.g << 8) + mix.b).toString(16).slice(1)}`;
}

export function mergeDesign(design) {
  const base = { ...defaultDesign };
  if (!design) {
    return base;
  }
  return {
    ...base,
    ...design,
    background: {
      ...base.background,
      ...(design.background || {})
    },
    profile: {
      ...base.profile,
      ...(design.profile || {})
    },
    layout: {
      ...base.layout,
      ...(design.layout || {}),
      sectionOrder: design.layout?.sectionOrder?.length
        ? Array.from(new Set([...design.layout.sectionOrder, ...base.layout.sectionOrder]))
        : base.layout.sectionOrder,
      linkStyle: {
        ...base.layout.linkStyle,
        ...((design.layout && design.layout.linkStyle) || {})
      }
    },
    palette: {
      ...base.palette,
      ...(design.palette || {})
    }
  };
}

export function computeBackgroundStyles(design) {
  const safe = design || defaultDesign.background;
  const mode = safe.mode || 'gradient';
  const colors = Array.isArray(safe.colors) && safe.colors.length > 0 ? safe.colors : defaultDesign.background.colors;
  const angle = safe.angle ?? 135;
  const overlayOpacity = clamp(safe.overlayOpacity ?? 0.55, 0, 1);
  const overlayStart = `rgba(10, 16, 26, ${overlayOpacity})`;
  const overlayEnd = `rgba(15, 23, 42, ${overlayOpacity * 0.6})`;

  const gradient = `linear-gradient(${angle}deg, ${colors.join(', ')})`;
  const noiseOpacity = clamp(safe.noiseOpacity ?? 0.1, 0, 0.6);
  const noiseBackground = `linear-gradient(${angle + 45}deg, rgba(255,255,255,${noiseOpacity}) 0%, rgba(255,255,255,0) 60%)`;

  if (mode === 'image' && safe.image) {
    return {
      backgroundImage: `${`linear-gradient(${angle}deg, ${overlayStart}, ${overlayEnd})`}, url(${safe.image}), ${noiseBackground}`,
      backgroundSize: 'cover, cover, 120%',
      backgroundBlendMode: 'normal, normal, soft-light',
      backgroundAttachment: 'fixed, fixed, fixed',
      backgroundPosition: 'center, center, center'
    };
  }

  if (mode === 'color') {
    return {
      background: colors[0] || '#0f172a'
    };
  }

  return {
    backgroundImage: `${gradient}, ${noiseBackground}`,
    backgroundSize: 'cover, 120%',
    backgroundAttachment: 'fixed, fixed'
  };
}

export function computeLinkStyle(design) {
  const layout = design.layout || defaultDesign.layout;
  const linkStyle = layout.linkStyle || defaultDesign.layout.linkStyle;
  const colors = design.background?.colors?.length ? design.background.colors : defaultDesign.background.colors;
  const primary = colors[0];
  const secondary = colors[colors.length - 1];
  const middle = mixColors(primary, secondary, 0.5);
  const transparency = clamp(linkStyle.transparency ?? 0.35, 0, 1);
  const gradientStrength = clamp(linkStyle.gradientStrength ?? 0.5, 0, 1);
  const accent = linkStyle.accentColor || secondary;
  const background = `linear-gradient(135deg, ${toRgba(primary, transparency + gradientStrength * 0.25)}, ${toRgba(
    secondary,
    transparency + gradientStrength * 0.4
  )})`;
  const borderColor = toRgba('#ffffff', 0.12 + gradientStrength * 0.05);
  const iconBackground = toRgba(middle, clamp(0.25 + gradientStrength * 0.2, 0, 0.75));
  const glow = linkStyle.glow !== false ? `0 18px 35px ${toRgba(accent, 0.18)}` : 'none';

  return {
    background,
    borderColor,
    iconBackground,
    textColor: linkStyle.textColor || '#0f172a',
    accent,
    borderRadius: `${linkStyle.borderRadius ?? 24}px`,
    boxShadow: glow
  };
}

export function computeSurfaceStyle(design) {
  return {
    backgroundColor: design.palette?.surface || defaultDesign.palette.surface,
    color: design.palette?.text || defaultDesign.palette.text,
    borderColor: design.palette?.glass || 'rgba(255,255,255,0.12)'
  };
}
