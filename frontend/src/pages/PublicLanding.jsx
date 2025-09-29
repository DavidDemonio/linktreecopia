import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle.jsx';
import LinkCard from '../components/LinkCard.jsx';

export default function PublicLanding() {
  const [links, setLinks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [linksRes, categoriesRes] = await Promise.all([
          fetch('/api/links').then((res) => res.json()),
          fetch('/api/categories').then((res) => res.json())
        ]);
        setLinks(linksRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error('Error loading data', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredLinks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return links.filter((link) => {
      const matchesCategory = activeCategory === 'all' || link.categories?.includes(activeCategory);
      const matchesSearch =
        term.length === 0 ||
        link.title.toLowerCase().includes(term) ||
        (link.description || '').toLowerCase().includes(term) ||
        link.slug.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [links, activeCategory, search]);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="glass-card flex flex-col items-start gap-6 bg-white/60 p-8 dark:bg-white/10">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-3xl border border-white/40 shadow-xl">
              <img
                src="https://avatars.dicebear.com/api/avataaars/linktreecopia.svg"
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold">LinktreeCopia</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">Descubre mis proyectos, artículos y contenido favorito.</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">
            <CategoryChip
              key="all"
              label="Todos"
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
            />
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                label={category.name}
                color={category.color}
                active={activeCategory === category.slug}
                onClick={() => setActiveCategory(category.slug)}
              />
            ))}
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar enlace..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-white/30 bg-white/70 px-4 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-white/10 dark:bg-white/10"
            />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 pb-16">
        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="glass-card h-24 animate-pulse bg-white/30 dark:bg-white/5" />
            ))}
          </div>
        ) : filteredLinks.length > 0 ? (
          <motion.div className="grid gap-4" initial="hidden" animate="visible" variants={listVariants}>
            {filteredLinks.map((link) => (
              <motion.div key={link.id} variants={itemVariants}>
                <LinkCard link={link} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="glass-card text-center text-slate-600 dark:text-slate-300">
            No encontramos enlaces con esos filtros.
          </div>
        )}
      </main>
    </div>
  );
}

function CategoryChip({ label, active, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-transparent bg-indigo-500/90 text-white shadow-lg'
          : 'border-white/30 bg-white/50 text-slate-700 hover:border-indigo-300 dark:border-white/10 dark:bg-white/10 dark:text-slate-200'
      }`}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
  );
}

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};
