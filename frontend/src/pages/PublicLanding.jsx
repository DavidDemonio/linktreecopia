import React, { useEffect, useState } from 'react';
import LandingView from '../components/LandingView.jsx';
import { mergeDesign } from '../utils/design.js';

export default function PublicLanding() {
  const [links, setLinks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [design, setDesign] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [linksRes, categoriesRes, designRes] = await Promise.all([
          fetch('/api/links').then((res) => res.json()),
          fetch('/api/categories').then((res) => res.json()),
          fetch('/api/design').then((res) => res.json())
        ]);
        if (cancelled) return;
        setLinks(linksRes.data || []);
        setCategories(categoriesRes.data || []);
        setDesign(mergeDesign(designRes.data));
      } catch (error) {
        console.error('Error loading landing data', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <LandingView
      design={design}
      links={links}
      categories={categories}
      loading={loading}
      activeCategory={activeCategory}
      search={search}
      onCategoryChange={setActiveCategory}
      onSearchChange={setSearch}
    />
  );
}
