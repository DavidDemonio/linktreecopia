import React, { useEffect, useState } from 'react';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAdmin } from '../context/AdminContext.jsx';
import { useToasts } from '../context/ToastContext.jsx';
import CategoryFormModal from '../components/CategoryFormModal.jsx';

export default function CategoriesPage() {
  const { apiFetch } = useAdmin();
  const { pushToast } = useToasts();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await apiFetch('/admin/api/categories');
      setCategories(result.data || []);
    } catch (error) {
      pushToast({ title: 'Error cargando categorías', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (payload) => {
    const { id, createdAt, updatedAt, ...rest } = payload;
    const cleanPayload = rest;
    try {
      if (editing) {
        const result = await apiFetch(`/admin/api/categories/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(cleanPayload)
        });
        setCategories((prev) => prev.map((item) => (item.id === editing.id ? result.data : item)));
        pushToast({ title: 'Categoría actualizada', type: 'success' });
      } else {
        const result = await apiFetch('/admin/api/categories', {
          method: 'POST',
          body: JSON.stringify(cleanPayload)
        });
        setCategories((prev) => [...prev, result.data]);
        pushToast({ title: 'Categoría creada', type: 'success' });
      }
    } catch (error) {
      error.details = error.details || error;
      throw error;
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`¿Eliminar categoría "${category.name}"?`)) return;
    try {
      await apiFetch(`/admin/api/categories/${category.id}`, { method: 'DELETE' });
      pushToast({ title: 'Categoría eliminada', type: 'success' });
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
    } catch (error) {
      pushToast({ title: 'Error al eliminar', description: error.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Categorías</h2>
          <p className="text-sm text-slate-300">Agrupa tus enlaces para mostrarlos mejor.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-400"
        >
          <PlusIcon className="h-5 w-5" /> Nueva categoría
        </button>
      </div>

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-inner">
        {loading ? (
          <div className="py-8 text-center text-slate-300">Cargando categorías...</div>
        ) : categories.length === 0 ? (
          <div className="py-8 text-center text-slate-300">Aún no tienes categorías.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((category) => (
              <div key={category.id} className="glass-card flex items-center justify-between bg-slate-900/60 p-4 text-white">
                <div>
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <p className="text-xs text-slate-300">Slug: {category.slug}</p>
                  {category.color && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }} />
                      {category.color}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(category);
                      setModalOpen(true);
                    }}
                    className="rounded-full border border-white/10 p-2 hover:border-indigo-400"
                    title="Editar"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    className="rounded-full border border-red-500/40 p-2 text-red-200 hover:bg-red-500/20"
                    title="Eliminar"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CategoryFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initialData={editing}
      />
    </div>
  );
}
