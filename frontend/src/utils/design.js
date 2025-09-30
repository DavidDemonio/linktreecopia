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

function parseColorToRgb(color) {
  if (!color) {
    return { r: 15, g: 23, b: 42 };
  }
  if (color.startsWith('rgb')) {
    const values = color
      .replace(/rgba?\(/, '')
      .replace(')', '')
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value, index) => index < 3);
    if (values.length === 3 && values.every((value) => Number.isFinite(value))) {
      return { r: values[0], g: values[1], b: values[2] };
    }
  }
  const hex = hexToRgb(color);
  if (hex) {
    return hex;
  }
  return { r: 15, g: 23, b: 42 };
}

function withAlpha(color, alpha) {
  const rgb = parseColorToRgb(color);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
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

  const incomingPalette = design.palette || {};
  const hasLegacyPalette = typeof incomingPalette.text === 'string' || typeof incomingPalette.surface === 'string';
  const palette = hasLegacyPalette
    ? {
        dark: { ...base.palette.dark, ...incomingPalette },
        light: { ...base.palette.light, ...incomingPalette }
      }
    : {
        dark: { ...base.palette.dark, ...(incomingPalette.dark || {}) },
        light: { ...base.palette.light, ...(incomingPalette.light || {}) }
      };

  const incomingLinkStyle = (design.layout && design.layout.linkStyle) || {};
  const normalizedLinkStyle = {
    ...base.layout.linkStyle,
    ...incomingLinkStyle
  };

  if (incomingLinkStyle.textColor && !incomingLinkStyle.textColorDark) {
    normalizedLinkStyle.textColorDark = incomingLinkStyle.textColor;
  }
  if (incomingLinkStyle.textColorLight == null && incomingLinkStyle.textColor && normalizedLinkStyle.textColorLight == null) {
    normalizedLinkStyle.textColorLight = '#0f172a';
  }
  if (incomingLinkStyle.accentColor && !incomingLinkStyle.accentColorDark) {
    normalizedLinkStyle.accentColorDark = incomingLinkStyle.accentColor;
  }
  if (incomingLinkStyle.accentColorLight == null && incomingLinkStyle.accentColor && normalizedLinkStyle.accentColorLight == null) {
    normalizedLinkStyle.accentColorLight = incomingLinkStyle.accentColor;
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
      linkStyle: normalizedLinkStyle,
      canvas: {
        ...base.layout.canvas,
        ...((design.layout && design.layout.canvas) || {})
      }
    },
    palette
  };
}

export function computeBackgroundStyles(design, theme = 'dark') {
  const safe = design || defaultDesign.background;
  const mode = safe.mode || 'gradient';
  const colors = Array.isArray(safe.colors) && safe.colors.length > 0 ? safe.colors : defaultDesign.background.colors;
  const angle = safe.angle ?? 135;
  const overlayOpacity = clamp(safe.overlayOpacity ?? 0.55, 0, 1);
  const overlayStart = theme === 'dark' ? `rgba(10, 16, 26, ${overlayOpacity})` : `rgba(255, 255, 255, ${overlayOpacity * 0.9})`;
  const overlayEnd = theme === 'dark' ? `rgba(15, 23, 42, ${overlayOpacity * 0.6})` : `rgba(255, 255, 255, ${overlayOpacity * 0.6})`;

  const lightenWeight = theme === 'light' && !safe.customGradient ? 0.32 : 0;
  const gradientColors = safe.customGradient
    ? []
    : colors.map((color) => (lightenWeight ? mixColors(color, '#ffffff', lightenWeight) : color));
  const gradient = safe.customGradient && safe.customGradient.trim()
    ? safe.customGradient.trim()
    : `linear-gradient(${angle}deg, ${gradientColors.join(', ')})`;
  const noiseOpacity = clamp(safe.noiseOpacity ?? 0.1, 0, 0.6);
  const noiseBase = 255;
  const noiseBackground = `linear-gradient(${angle + 45}deg, rgba(${noiseBase},${noiseBase},${noiseBase},${noiseOpacity}) 0%, rgba(${noiseBase},${noiseBase},${noiseBase},0) 60%)`;

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
      background: safe.customGradient && safe.customGradient.trim()
        ? safe.customGradient.trim()
        : colors[0] || '#0f172a'
    };
  }

  return {
    backgroundImage: `${gradient}, ${noiseBackground}`,
    backgroundSize: 'cover, 120%',
    backgroundAttachment: 'fixed, fixed'
  };
}

export function computeLinkStyle(design, theme = 'dark') {
  const layout = design.layout || defaultDesign.layout;
  const linkStyle = layout.linkStyle || defaultDesign.layout.linkStyle;
  const colors = design.background?.colors?.length ? design.background.colors : defaultDesign.background.colors;
  const primary = theme === 'light' ? mixColors(colors[0], '#ffffff', 0.2) : colors[0];
  const secondary = theme === 'light' ? mixColors(colors[colors.length - 1], '#ffffff', 0.2) : colors[colors.length - 1];
  const middle = mixColors(primary, secondary, 0.5);
  const transparency = clamp(linkStyle.transparency ?? 0.35, 0, 1);
  const gradientStrength = clamp(linkStyle.gradientStrength ?? 0.5, 0, 1);
  const accent = theme === 'light'
    ? linkStyle.accentColorLight || linkStyle.accentColor || secondary
    : linkStyle.accentColorDark || linkStyle.accentColor || secondary;
  const background = linkStyle.customGradient && linkStyle.customGradient.trim()
    ? linkStyle.customGradient.trim()
    : `linear-gradient(135deg, ${toRgba(primary, transparency + gradientStrength * 0.25)}, ${toRgba(
        secondary,
        transparency + gradientStrength * 0.4
      )})`;
  const borderBase = theme === 'light' ? '#0f172a' : '#ffffff';
  const borderColor = toRgba(borderBase, 0.12 + gradientStrength * 0.05);
  const iconBackground = toRgba(middle, clamp(0.25 + gradientStrength * 0.2, 0, 0.75));
  const glow = linkStyle.glow !== false ? `0 18px 35px ${toRgba(accent, 0.18)}` : 'none';
  const textColor = theme === 'light'
    ? linkStyle.textColorLight || '#0f172a'
    : linkStyle.textColorDark || linkStyle.textColor || '#f9fafb';

  return {
    background,
    borderColor,
    iconBackground,
    textColor,
    accent,
    borderRadius: `${linkStyle.borderRadius ?? 24}px`,
    boxShadow: glow,
    paddingX: linkStyle.paddingX ?? defaultDesign.layout.linkStyle.paddingX,
    paddingY: linkStyle.paddingY ?? defaultDesign.layout.linkStyle.paddingY,
    gap: linkStyle.gap ?? defaultDesign.layout.linkStyle.gap
  };
}

export function computeSurfaceStyle(design, theme = 'dark') {
  const palette = design.palette || defaultDesign.palette;
  const themePalette = palette[theme] || palette.dark || defaultDesign.palette.dark;
  const baseSurface = themePalette.surface || defaultDesign.palette.dark.surface;
  return {
    backgroundColor: baseSurface,
    color: themePalette.text || defaultDesign.palette.dark.text,
    borderColor: themePalette.glass || defaultDesign.palette.dark.glass,
    textMuted: themePalette.textMuted || defaultDesign.palette.dark.textMuted,
    softBackground: withAlpha(baseSurface, theme === 'dark' ? 0.75 : 0.82),
    fieldBackground: withAlpha(baseSurface, theme === 'dark' ? 0.6 : 0.9)
  };
}
