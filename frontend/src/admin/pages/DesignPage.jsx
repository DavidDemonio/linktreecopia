import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon, ArrowPathIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import LandingView from '../../components/LandingView.jsx';
import { defaultDesign } from '../../config/defaultDesign.js';
import { mergeDesign } from '../../utils/design.js';
import { useAdmin } from '../context/AdminContext.jsx';
import { useToasts } from '../context/ToastContext.jsx';

const sectionOptions = [
  { id: 'profile', label: 'Encabezado' },
  { id: 'filters', label: 'Filtros' },
  { id: 'links', label: 'Listado' }
];

function SortableSection({ id, label }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 backdrop-blur ${
        isDragging ? 'shadow-xl shadow-indigo-500/30' : ''
      }`}
    >
      <span>{label}</span>
      <button type="button" className="rounded-full border border-white/20 p-1 text-white/60" {...attributes} {...listeners}>
        <Bars3Icon className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function DesignPage() {
  const { apiFetch, getCsrfToken } = useAdmin();
  const { pushToast } = useToasts();
  const [draft, setDraft] = useState(null);
  const [links, setLinks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [designRes, linksRes, categoriesRes] = await Promise.all([
        apiFetch('/admin/api/design'),
        apiFetch('/admin/api/links'),
        apiFetch('/admin/api/categories')
      ]);
      setDraft(mergeDesign(designRes.data));
      setLinks(linksRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error loading design data', error);
      pushToast({ title: 'No se pudo cargar', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [apiFetch, pushToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const previewLinks = useMemo(() => links.slice(0, 6), [links]);

  const handleBackgroundColorChange = (index, value) => {
    setDraft((prev) => {
      const colors = [...(prev?.background?.colors || defaultDesign.background.colors)];
      colors[index] = value;
      return {
        ...prev,
        background: {
          ...prev.background,
          colors
        }
      };
    });
  };

  const handleAddBackgroundColor = () => {
    setDraft((prev) => {
      const colors = [...(prev?.background?.colors || [])];
      if (colors.length >= 4) return prev;
      colors.push('#ffffff');
      return {
        ...prev,
        background: {
          ...prev.background,
          colors
        }
      };
    });
  };

  const handleRemoveBackgroundColor = (index) => {
    setDraft((prev) => {
      const colors = [...(prev?.background?.colors || [])];
      if (colors.length <= 1) return prev;
      colors.splice(index, 1);
      return {
        ...prev,
        background: {
          ...prev.background,
          colors
        }
      };
    });
  };

  const handleUpload = async (event, target) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = await getCsrfToken();
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/admin/api/uploads', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': token
        },
        body: formData
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error?.message || 'Error al subir el archivo');
      }
      const json = await response.json();
      setDraft((prev) => {
        if (target === 'background.image') {
          return {
            ...prev,
            background: {
              ...prev.background,
              image: json.data.url,
              mode: 'image'
            }
          };
        }
        if (target === 'profile.avatar') {
          return {
            ...prev,
            profile: {
              ...prev.profile,
              avatar: json.data.url
            }
          };
        }
        return prev;
      });
      pushToast({ title: 'Archivo subido', description: 'Tu imagen está lista.', type: 'success' });
    } catch (error) {
      console.error('Upload error', error);
      pushToast({ title: 'No se pudo subir', description: error.message, type: 'error' });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const payload = {
        ...draft,
        background: { ...draft.background },
        profile: { ...draft.profile },
        layout: {
          ...draft.layout,
          linkStyle: { ...draft.layout.linkStyle }
        },
        palette: { ...draft.palette }
      };
      const result = await apiFetch('/admin/api/design', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setDraft(mergeDesign(result.data));
      pushToast({ title: 'Diseño guardado', type: 'success' });
    } catch (error) {
      console.error('Save design error', error);
      pushToast({ title: 'No se pudo guardar', description: error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(mergeDesign(defaultDesign));
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraft((prev) => {
      const currentOrder = prev.layout.sectionOrder || [];
      const oldIndex = currentOrder.indexOf(active.id);
      const newIndex = currentOrder.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const updated = arrayMove(currentOrder, oldIndex, newIndex);
      return {
        ...prev,
        layout: {
          ...prev.layout,
          sectionOrder: updated
        }
      };
    });
  };

  if (loading || !draft) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
        Cargando diseñador...
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
      <div className="space-y-6">
        <div className="glass-card bg-slate-950/60 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Estilo visual</h2>
              <p className="text-sm text-slate-300">Modifica el fondo, los colores y los bloques visibles.</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:border-indigo-400 hover:text-white"
            >
              <ArrowPathIcon className="h-4 w-4" /> Reset
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Modo de fondo</label>
              <select
                value={draft.background.mode}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    background: {
                      ...prev.background,
                      mode: event.target.value
                    }
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
              >
                <option value="gradient">Degradado</option>
                <option value="image">Imagen</option>
                <option value="color">Color sólido</option>
              </select>
            </div>

            {draft.background.mode !== 'color' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Colores del degradado</label>
                  <button
                    type="button"
                    onClick={handleAddBackgroundColor}
                    className="text-xs text-indigo-300 hover:text-white"
                    disabled={draft.background.colors.length >= 4}
                  >
                    Añadir color
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {draft.background.colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(event) => handleBackgroundColorChange(index, event.target.value)}
                        className="h-10 w-10 cursor-pointer rounded-full border border-white/20 bg-transparent"
                      />
                      {draft.background.colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBackgroundColor(index)}
                          className="text-xs text-red-300 hover:text-red-100"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Ángulo</span>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={draft.background.angle}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        background: { ...prev.background, angle: Number(event.target.value) }
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {draft.background.mode === 'color' && (
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Color</label>
                <input
                  type="color"
                  value={draft.background.colors[0]}
                  onChange={(event) => handleBackgroundColorChange(0, event.target.value)}
                  className="h-12 w-12 cursor-pointer rounded-full border border-white/20 bg-transparent"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Opacidad del velo</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((draft.background.overlayOpacity ?? 0.6) * 100)}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      background: { ...prev.background, overlayOpacity: Number(event.target.value) / 100 }
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Textura</label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={Math.round((draft.background.noiseOpacity ?? 0.1) * 100)}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      background: { ...prev.background, noiseOpacity: Number(event.target.value) / 100 }
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Imagen de fondo</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/80 transition hover:border-indigo-400 hover:text-white">
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  {uploading ? 'Subiendo...' : 'Subir'}
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => handleUpload(event, 'background.image')} />
                </label>
                {draft.background.image && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        background: { ...prev.background, image: '', mode: 'gradient' }
                      }))
                    }
                    className="text-xs text-red-300 hover:text-red-100"
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
              {draft.background.image && (
                <img src={draft.background.image} alt="Fondo" className="h-28 w-full rounded-2xl object-cover" />
              )}
            </div>
          </div>
        </div>

        <div className="glass-card bg-slate-950/60 text-white">
          <h3 className="text-lg font-semibold">Contenido</h3>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Nombre</label>
              <input
                type="text"
                value={draft.profile.displayName}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, displayName: event.target.value }
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Descripción</label>
              <textarea
                value={draft.profile.bio || ''}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, bio: event.target.value }
                  }))
                }
                className="h-24 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Destacado</label>
              <input
                type="text"
                value={draft.profile.highlight || ''}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, highlight: event.target.value }
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Usuario</label>
              <input
                type="text"
                value={draft.profile.socialHandle || ''}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, socialHandle: event.target.value }
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Avatar</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/80 transition hover:border-indigo-400 hover:text-white">
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  {uploading ? 'Subiendo...' : 'Cambiar'}
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => handleUpload(event, 'profile.avatar')} />
                </label>
                {draft.profile.avatar && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, avatar: '' }
                      }))
                    }
                    className="text-xs text-red-300 hover:text-red-100"
                  >
                    Quitar avatar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card bg-slate-950/60 text-white">
          <h3 className="text-lg font-semibold">Disposición</h3>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Alineación</label>
              <div className="grid grid-cols-3 gap-2">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        layout: { ...prev.layout, alignment: align }
                      }))
                    }
                    className={`rounded-2xl border px-3 py-2 text-xs uppercase tracking-[0.2em] transition ${
                      draft.layout.alignment === align ? 'border-indigo-400 bg-indigo-500/30 text-white' : 'border-white/10 text-white/70'
                    }`}
                  >
                    {align === 'left' ? 'Izquierda' : align === 'center' ? 'Centro' : 'Derecha'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Orden de secciones</label>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={draft.layout.sectionOrder} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {draft.layout.sectionOrder.map((section) => {
                      const meta = sectionOptions.find((item) => item.id === section) || { id: section, label: section };
                      return <SortableSection key={section} id={section} label={meta.label} />;
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-300">
                <input
                  type="checkbox"
                  checked={draft.layout.showCategories}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      layout: { ...prev.layout, showCategories: event.target.checked }
                    }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                />
                Categorías
              </label>
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-300">
                <input
                  type="checkbox"
                  checked={draft.layout.showSearch}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      layout: { ...prev.layout, showSearch: event.target.checked }
                    }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                />
                Buscador
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Curvatura de los botones</label>
              <input
                type="range"
                min="12"
                max="48"
                value={draft.layout.linkStyle.borderRadius}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    layout: {
                      ...prev.layout,
                      linkStyle: { ...prev.layout.linkStyle, borderRadius: Number(event.target.value) }
                    }
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Transparencia</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(draft.layout.linkStyle.transparency * 100)}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      layout: {
                        ...prev.layout,
                        linkStyle: { ...prev.layout.linkStyle, transparency: Number(event.target.value) / 100 }
                      }
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Degradado</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(draft.layout.linkStyle.gradientStrength * 100)}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      layout: {
                        ...prev.layout,
                        linkStyle: { ...prev.layout.linkStyle, gradientStrength: Number(event.target.value) / 100 }
                      }
                    }))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-300">
              <input
                type="checkbox"
                checked={draft.layout.linkStyle.glow}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    layout: {
                      ...prev.layout,
                      linkStyle: { ...prev.layout.linkStyle, glow: event.target.checked }
                    }
                  }))
                }
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              Brillo sutil
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-indigo-400 disabled:cursor-wait disabled:bg-indigo-500/60"
        >
          {saving ? 'Guardando...' : 'Guardar diseño'}
        </button>
      </div>

      <div className="rounded-[36px] border border-white/10 bg-slate-900/20 p-4 backdrop-blur-2xl">
        <LandingView
          design={draft}
          links={previewLinks}
          categories={categories}
          loading={false}
          activeCategory={activeCategory}
          search={search}
          onCategoryChange={setActiveCategory}
          onSearchChange={setSearch}
          preview
        />
      </div>
    </div>
  );
}
