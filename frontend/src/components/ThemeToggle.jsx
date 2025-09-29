import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from './ThemeProvider.jsx';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/40 px-3 py-2 text-sm font-medium shadow-sm backdrop-blur-lg transition hover:scale-[1.02] hover:border-white/40 dark:bg-white/10 ${className}`}
    >
      {theme === 'dark' ? (
        <>
          <SunIcon className="h-4 w-4" />
          Modo claro
        </>
      ) : (
        <>
          <MoonIcon className="h-4 w-4" />
          Modo oscuro
        </>
      )}
    </button>
  );
}
