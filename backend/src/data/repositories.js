import { v4 as uuid } from 'uuid';
import { readJson, writeJson, updateJson } from './storage.js';

const LINKS_FILE = 'links.json';
const CATEGORIES_FILE = 'categories.json';
const STATS_FILE = 'stats.json';

export async function getLinks() {
  return readJson(LINKS_FILE, []);
}

export async function saveLinks(links) {
  await writeJson(LINKS_FILE, links);
  return links;
}

export async function getCategories() {
  return readJson(CATEGORIES_FILE, []);
}

export async function saveCategories(categories) {
  await writeJson(CATEGORIES_FILE, categories);
  return categories;
}

export async function getStats() {
  return readJson(STATS_FILE, {});
}

export async function saveStats(stats) {
  await writeJson(STATS_FILE, stats);
  return stats;
}

export async function createLink(payload) {
  const now = new Date().toISOString();
  const link = {
    id: uuid(),
    title: payload.title,
    url: payload.url,
    slug: payload.slug,
    description: payload.description || '',
    icon: payload.icon || '',
    categories: payload.categories || [],
    active: payload.active ?? true,
    order: payload.order ?? 0,
    createdAt: now,
    updatedAt: now
  };
  const links = await getLinks();
  link.order = payload.order ?? links.length;
  links.push(link);
  await saveLinks(sortLinks(links));
  return link;
}

export async function updateLink(id, payload) {
  const links = await getLinks();
  const index = links.findIndex((link) => link.id === id);
  if (index === -1) return null;
  const now = new Date().toISOString();
  const updated = {
    ...links[index],
    ...payload,
    categories: payload.categories ?? links[index].categories,
    updatedAt: now
  };
  links[index] = updated;
  await saveLinks(sortLinks(links));
  return updated;
}

export async function deleteLink(id) {
  const links = await getLinks();
  const index = links.findIndex((link) => link.id === id);
  if (index === -1) return false;
  links.splice(index, 1);
  links.forEach((link, idx) => {
    link.order = idx;
  });
  await saveLinks(sortLinks(links));
  return true;
}

export async function reorderLinks(order) {
  const links = await getLinks();
  const map = new Map(links.map((link) => [link.id, link]));
  const reordered = order
    .map((id, index) => {
      const link = map.get(id);
      if (!link) return null;
      return { ...link, order: index };
    })
    .filter(Boolean);
  const missing = links.filter((link) => !order.includes(link.id));
  missing.sort((a, b) => a.order - b.order);
  missing.forEach((link, idx) => {
    reordered.push({ ...link, order: order.length + idx });
  });
  await saveLinks(sortLinks(reordered));
  return reordered;
}

export async function createCategory(payload) {
  const now = new Date().toISOString();
  const category = {
    id: uuid(),
    name: payload.name,
    slug: payload.slug,
    color: payload.color || '',
    createdAt: now,
    updatedAt: now
  };
  const categories = await getCategories();
  categories.push(category);
  await saveCategories(categories);
  return category;
}

export async function updateCategory(id, payload) {
  const categories = await getCategories();
  const index = categories.findIndex((category) => category.id === id);
  if (index === -1) return null;
  const now = new Date().toISOString();
  const updated = {
    ...categories[index],
    ...payload,
    updatedAt: now
  };
  categories[index] = updated;
  await saveCategories(categories);
  return updated;
}

export async function deleteCategory(id) {
  const categories = await getCategories();
  const index = categories.findIndex((category) => category.id === id);
  if (index === -1) return false;
  const [removed] = categories.splice(index, 1);
  await saveCategories(categories);
  await updateJson(LINKS_FILE, async (links) => {
    return links.map((link) => ({
      ...link,
      categories: link.categories.filter((slug) => slug !== removed.slug)
    }));
  }, []);
  return true;
}

function sortLinks(links) {
  return [...links].sort((a, b) => a.order - b.order);
}

export async function recordClick(linkId, fingerprint) {
  const today = new Date().toISOString().slice(0, 10);
  return updateJson(STATS_FILE, async (stats = {}) => {
    const linkStats = stats[linkId] || { totalClicks: 0, daily: {} };
    linkStats.totalClicks += 1;
    const dayStats = linkStats.daily[today] || { total: 0, uniques: [], uniqueCount: 0 };
    dayStats.total += 1;
    if (!dayStats.uniques.includes(fingerprint)) {
      dayStats.uniques.push(fingerprint);
      dayStats.uniqueCount = (dayStats.uniqueCount || 0) + 1;
    }
    linkStats.daily[today] = dayStats;
    stats[linkId] = linkStats;
    return stats;
  }, {});
}

export async function normalizeStats() {
  return updateJson(STATS_FILE, async (stats = {}) => {
    Object.values(stats).forEach((linkStats) => {
      Object.entries(linkStats.daily || {}).forEach(([date, day]) => {
        if (Array.isArray(day.uniques)) {
          day.uniqueCount = day.uniques.length;
        }
      });
    });
    return stats;
  }, {});
}
