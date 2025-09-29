import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAdmin } from '../context/AdminContext.jsx';
import { useToasts } from '../context/ToastContext.jsx';
import LinkFormModal from '../components/LinkFormModal.jsx';

export default function LinksPage() {
  const { apiFetch } = useAdmin();
  const { pushToast } = useToasts();
  const [links, setLinks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ search: '', category: 'all' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [linksRes, categoriesRes] = await Promise.all([
        apiFetch('/admin/api/links'),
        apiFetch('/admin/api/categories')
      ]);
      setLinks((linksRes.data || []).sort((a, b) => a.order - b.order));
      setCategories(categoriesRes.data || []);
    } catch (error) {
      pushToast({ title: 'Error cargando datos', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLinks = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return links.filter((link) => {
      const matchesCategory = filters.category === 'all' || link.categories.includes(filters.category);
      const matchesSearch =
        term.length === 0 ||
        link.title.toLowerCase().includes(term) ||
        (link.description || '').toLowerCase().includes(term) ||
        link.slug.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [links, filters]);

  const handleSave = async (payload) => {
    const { id, createdAt, updatedAt, ...rest } = payload;
    const cleanPayload = {
      ...rest,
      categories: rest.categories || []
    };
    try {
      if (editing) {
        const result = await apiFetch(`/admin/api/links/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(cleanPayload)
        });
        setLinks((prev) => prev.map((item) => (item.id === editing.id ? result.data : item)).sort((a, b) => a.order - b.order));
        pushToast({ title: 'Enlace actualizado', type: 'success' });
      } else {
        const result = await apiFetch('/admin/api/links', {
          method: 'POST',
          body: JSON.stringify(cleanPayload)
        });
        setLinks((prev) => [...prev, result.data].sort((a, b) => a.order - b.order));
        pushToast({ title: 'Enlace creado', type: 'success' });
      }
    } catch (error) {
      error.details = error.details || error;
      throw error;
    }
  };

  const handleDelete = async (link) => {
    if (!window.confirm(`¿Eliminar enlace "${link.title}"?`)) return;
    try {
      await apiFetch(`/admin/api/links/${link.id}`, { method: 'DELETE' });
      pushToast({ title: 'Enlace eliminado', type: 'success' });
      setLinks((prev) => prev.filter((item) => item.id !== link.id));
    } catch (error) {
      pushToast({ title: 'Error al eliminar', description: error.message, type: 'error' });
    }
  };

  const handleReorder = async (linkId, direction) => {
    const currentIndex = links.findIndex((link) => link.id === linkId);
    if (currentIndex === -1) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= links.length) return;
    const reordered = [...links];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    const ids = reordered.map((link) => link.id);
    setLinks(reordered.map((link, index) => ({ ...link, order: index })));
    try {
      await apiFetch('/admin/api/links/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ ids })
      });
      pushToast({ title: 'Orden actualizado', type: 'success' });
    } catch (error) {
      pushToast({ title: 'No se pudo reordenar', description: error.message, type: 'error' });
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Links</h2>
          <p className="text-sm text-slate-300">Gestiona tus enlaces y su orden de aparición.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-400"
        >
          <PlusIcon className="h-5 w-5" /> Nuevo enlace
        </button>
      </div>

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-inner">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Buscar..."
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <select
            value={filters.category}
            onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Categorías</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-slate-300">
                    Cargando enlaces...
                  </td>
                </tr>
              ) : filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-slate-300">
                    Sin resultados.
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => (
                  <tr key={link.id} className="transition hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{link.title}</div>
                      <div className="text-xs text-slate-300">{link.url}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{link.slug}</td>
                    <td className="px-4 py-3 text-slate-300">
                      <div className="flex flex-wrap gap-2">
                        {link.categories.map((slug) => {
                          const category = categories.find((item) => item.slug === slug);
                          return (
                            <span key={slug} className="rounded-full bg-indigo-500/30 px-3 py-1 text-xs text-white">
                              {category?.name || slug}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          link.active ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {link.active ? 'Activo' : 'Oculto'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleReorder(link.id, -1)}
                          className="rounded-full border border-white/10 p-2 hover:border-indigo-400"
                          title="Subir"
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(link.id, 1)}
                          className="rounded-full border border-white/10 p-2 hover:border-indigo-400"
                          title="Bajar"
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(link);
                            setModalOpen(true);
                          }}
                          className="rounded-full border border-white/10 p-2 hover:border-indigo-400"
                          title="Editar"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(link)}
                          className="rounded-full border border-red-500/40 p-2 text-red-200 hover:bg-red-500/20"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LinkFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        categories={categories}
        initialData={editing}
      />
    </div>
  );
}
