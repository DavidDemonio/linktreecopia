import React from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function LinkCard({ link }) {
  return (
    <motion.a
      href={`/api/go/${link.slug}`}
      target="_self"
      rel="noopener noreferrer"
      className="glass-card flex items-center justify-between gap-4"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex flex-1 items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-2xl shadow-inner dark:bg-white/10">
          <span aria-hidden>{link.icon || '🔗'}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold">{link.title}</h3>
          {link.description && <p className="text-sm text-slate-700 dark:text-slate-300">{link.description}</p>}
          <p className="text-xs text-slate-500 dark:text-slate-400">{link.url.replace(/^https?:\/\//, '')}</p>
        </div>
      </div>
      <ArrowTopRightOnSquareIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
    </motion.a>
  );
}
