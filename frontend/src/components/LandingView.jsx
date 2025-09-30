import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle.jsx';
import LinkCard from './LinkCard.jsx';
import { mergeDesign, computeBackgroundStyles, computeLinkStyle, computeSurfaceStyle } from '../utils/design.js';
import { useTheme } from './ThemeProvider.jsx';

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 }
};

const sectionLabels = {
  profile: 'Perfil',
  filters: 'Filtros',
  links: 'Enlaces'
};

function CategoryChip({ label, active, onClick, palette, color }) {
  const baseBorder = palette?.glass || 'rgba(148,163,184,0.25)';
  const activeText = palette?.text || '#1f2937';
  const mutedText = palette?.textMuted || 'rgba(148,163,184,0.85)';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
        active ? 'shadow-lg' : 'hover:scale-[1.02]'
      }`}
      style={{
        background: active ? color || baseBorder : 'transparent',
        borderColor: active ? color || baseBorder : baseBorder,
        color: active ? activeText : mutedText
      }}
    >
      {label}
    </button>
  );
}

export default function LandingView({
  design,
  links = [],
  categories = [],
  loading = false,
  activeCategory = 'all',
  search = '',
  onCategoryChange = () => {},
  onSearchChange = () => {},
  preview = false
}) {
  const safeDesign = useMemo(() => mergeDesign(design), [design]);
  const { theme } = useTheme();
  const backgroundStyles = useMemo(
    () => computeBackgroundStyles(safeDesign.background, theme),
    [safeDesign, theme]
  );
  const linkStyle = useMemo(() => computeLinkStyle(safeDesign, theme), [safeDesign, theme]);
  const surfaceStyle = useMemo(() => computeSurfaceStyle(safeDesign, theme), [safeDesign, theme]);
  const palette = safeDesign.palette?.[theme] || safeDesign.palette?.dark;

  const filteredLinks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return links
      .filter((link) => link.active !== false)
      .filter((link) => {
        if (activeCategory === 'all') return true;
        return link.categories?.includes(activeCategory);
      })
      .filter((link) => {
        if (!term) return true;
        return (
          link.title.toLowerCase().includes(term) ||
          (link.description || '').toLowerCase().includes(term) ||
          link.slug.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [links, activeCategory, search]);

  const alignment = safeDesign.layout.alignment || 'center';
  const canvas = safeDesign.layout.canvas;
  const alignmentClass =
    alignment === 'left' ? 'items-start text-left' : alignment === 'right' ? 'items-end text-right' : 'items-center text-center';

  const orderedSections = safeDesign.layout.sectionOrder || ['profile', 'filters', 'links'];

  const profileSection = (
    <header
      key="profile"
      className="w-full overflow-hidden rounded-[36px] border px-8 py-10 shadow-[0_35px_120px_rgba(15,23,42,0.45)] backdrop-blur-2xl"
      style={{
        backgroundColor: surfaceStyle.backgroundColor,
        borderColor: surfaceStyle.borderColor,
        color: surfaceStyle.color
      }}
    >
      <div className="flex w-full flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col items-center gap-6 md:flex-row md:items-center md:text-left">
            <div className="relative h-28 w-28 overflow-hidden rounded-[32px] border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              {safeDesign.profile.avatar ? (
                <img src={safeDesign.profile.avatar} alt={safeDesign.profile.displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10 text-4xl">
                <span role="img" aria-label="Avatar">
                  ✨
                </span>
              </div>
            )}
          </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.35em]" style={{ color: surfaceStyle.textMuted }}>
                  {safeDesign.profile.socialHandle}
                </span>
                <h1 className="text-4xl font-bold tracking-tight" style={{ color: palette.text }}>
                  {safeDesign.profile.displayName}
                </h1>
              </div>
            {safeDesign.profile.bio && (
              <p className="max-w-xl text-base" style={{ color: surfaceStyle.textMuted }}>
                {safeDesign.profile.bio}
              </p>
            )}
            {safeDesign.profile.highlight && (
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.25em]"
                style={{
                  backgroundColor: palette.glass,
                  borderColor: palette.glass,
                  color: palette.text
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: linkStyle.accent }} />
                {safeDesign.profile.highlight}
              </div>
            )}
          </div>
        </div>
        <div className="self-center md:self-start">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );

  const filtersSection = (
    <section
      key="filters"
      className="w-full rounded-[28px] border px-6 py-6 backdrop-blur-xl"
      style={{
        backgroundColor: surfaceStyle.softBackground,
        borderColor: surfaceStyle.borderColor,
        color: surfaceStyle.color
      }}
    >
      <div className="flex w-full flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {safeDesign.layout.showCategories && (
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            <CategoryChip
              key="all"
              label="Todos"
              active={activeCategory === 'all'}
              onClick={() => onCategoryChange('all')}
              palette={palette}
              color={linkStyle.accent}
            />
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                label={category.name}
                color={category.color}
                active={activeCategory === category.slug}
                onClick={() => onCategoryChange(category.slug)}
                palette={palette}
              />
            ))}
          </div>
        )}
        {safeDesign.layout.showSearch && (
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar enlace..."
                className="w-full rounded-full border px-5 py-3 text-sm focus:outline-none focus:ring-4"
                style={{
                  backgroundColor: surfaceStyle.fieldBackground,
                  borderColor: surfaceStyle.borderColor,
                  color: surfaceStyle.color
                }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const linksSection = (
    <section key="links" className="w-full">
      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 rounded-[28px] border"
              style={{
                backgroundColor: surfaceStyle.softBackground,
                borderColor: surfaceStyle.borderColor
              }}
            />
          ))}
        </div>
      ) : filteredLinks.length > 0 ? (
        <motion.div
          className="grid"
          style={{ gap: `${linkStyle.gap}px` }}
          initial="hidden"
          animate="visible"
          variants={listVariants}
        >
          {filteredLinks.map((link) => (
            <motion.div key={link.id} variants={itemVariants}>
              <LinkCard link={link} stylePreset={linkStyle} preview={preview} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div
          className="rounded-[28px] border px-6 py-12 text-center text-sm"
          style={{
            backgroundColor: surfaceStyle.softBackground,
            borderColor: surfaceStyle.borderColor,
            color: surfaceStyle.color
          }}
        >
          No encontramos enlaces con esos filtros.
        </div>
      )}
    </section>
  );

  const sectionMap = {
    profile: profileSection,
    filters: filtersSection,
    links: linksSection
  };

  return (
    <div className="min-h-screen" style={{ ...backgroundStyles, color: palette?.text }}>
      <div
        className={`mx-auto flex min-h-screen w-full flex-col ${alignmentClass}`}
        style={{
          maxWidth: canvas?.maxWidth || 900,
          paddingLeft: canvas?.paddingX || 28,
          paddingRight: canvas?.paddingX || 28,
          paddingTop: canvas?.paddingY || 96,
          paddingBottom: canvas?.paddingY || 96,
          gap: canvas?.sectionSpacing || 44
        }}
      >
        {orderedSections.map((sectionKey) => sectionMap[sectionKey]).filter(Boolean)}
        {preview && (
          <div className="rounded-3xl border border-dashed border-white/30 px-6 py-4 text-xs uppercase tracking-[0.3em] text-white/70">
            Vista previa en vivo · {orderedSections.map((key) => sectionLabels[key] || key).join(' • ')}
          </div>
        )}
      </div>
    </div>
  );
}
