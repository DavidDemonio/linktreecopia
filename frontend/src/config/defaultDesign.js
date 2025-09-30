export const defaultDesign = {
  background: {
    mode: 'gradient',
    angle: 135,
    colors: ['#0f172a', '#312e81', '#9333ea'],
    image: '',
    overlayOpacity: 0.6,
    noiseOpacity: 0.12
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
      textColor: '#f9fafb',
      accentColor: '#a855f7',
      glow: true
    }
  },
  palette: {
    text: '#f8fafc',
    textMuted: '#cbd5f5',
    surface: 'rgba(15,23,42,0.72)',
    glass: 'rgba(255,255,255,0.08)'
  }
};
