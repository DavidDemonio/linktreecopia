export const defaultDesign = {
  background: {
    mode: 'gradient',
    angle: 135,
    colors: ['#0f172a', '#312e81', '#9333ea'],
    image: '',
    overlayOpacity: 0.6,
    noiseOpacity: 0.12,
    customGradient: ''
  },
  profile: {
    displayName: 'LinktreeCopia',
    bio: 'Descubre mis proyectos, artículos y contenido favorito.',
    avatar: '',
    highlight: 'Construyendo experiencias digitales memorables',
    socialHandle: '@linktreecopia'
  },
  layout: {
    alignment: 'center',
    sectionOrder: ['profile', 'filters', 'links'],
    showSearch: true,
    showCategories: true,
    linkStyle: {
      borderRadius: 26,
      transparency: 0.35,
      gradientStrength: 0.55,
      textColorDark: '#f9fafb',
      textColorLight: '#0f172a',
      accentColorDark: '#a855f7',
      accentColorLight: '#6d28d9',
      glow: true,
      paddingX: 28,
      paddingY: 18,
      gap: 20,
      customGradient: ''
    },
    canvas: {
      maxWidth: 900,
      paddingX: 28,
      paddingY: 96,
      sectionSpacing: 44
    }
  },
  palette: {
    dark: {
      text: '#f8fafc',
      textMuted: '#cbd5f5',
      surface: 'rgba(15,23,42,0.72)',
      glass: 'rgba(255,255,255,0.08)'
    },
    light: {
      text: '#0f172a',
      textMuted: '#334155',
      surface: 'rgba(255,255,255,0.9)',
      glass: 'rgba(15,23,42,0.08)'
    }
  }
};
