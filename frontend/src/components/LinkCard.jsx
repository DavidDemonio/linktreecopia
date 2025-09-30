import React from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function LinkCard({ link, stylePreset, preview = false }) {
  const href = preview ? '#' : `/go/${link.slug}`;
  const onClick = preview
    ? (event) => {
        event.preventDefault();
      }
    : undefined;

  const background = stylePreset?.background || 'rgba(255,255,255,0.12)';
  const borderColor = stylePreset?.borderColor || 'rgba(255,255,255,0.18)';
  const textColor = stylePreset?.textColor || '#0f172a';
  const iconBackground = stylePreset?.iconBackground || 'rgba(255,255,255,0.25)';
  const accentColor = stylePreset?.accent || textColor;
  const paddingX = stylePreset?.paddingX ?? 24;
  const paddingY = stylePreset?.paddingY ?? 20;

  return (
    <motion.a
      href={href}
      onClick={onClick}
      target="_self"
      rel="noopener noreferrer"
      className="group flex items-center justify-between gap-5 border transition-all duration-200"
      style={{
        borderColor,
        borderRadius: stylePreset?.borderRadius || '26px',
        background,
        color: textColor,
        boxShadow: stylePreset?.boxShadow || '0 18px 35px rgba(15,23,42,0.25)',
        padding: `${paddingY}px ${paddingX}px`
      }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex flex-1 items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-inner"
          style={{
            background: iconBackground,
            color: textColor
          }}
        >
          <span aria-hidden>{link.icon || '🔗'}</span>
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold tracking-tight" style={{ color: textColor }}>
            {link.title}
          </h3>
          {link.description && (
            <p className="text-sm opacity-80" style={{ color: textColor }}>
              {link.description}
            </p>
          )}
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: accentColor, opacity: 0.8 }}>
            {link.url.replace(/^https?:\/\//, '')}
          </p>
        </div>
      </div>
      <ArrowTopRightOnSquareIcon
        className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
        style={{ color: accentColor }}
      />
    </motion.a>
  );
}
