import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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
  const [paletteMode, setPaletteMode] = useState('dark');

  const previewContainerRef = useRef(null);
  const buttonDemoRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const handleCanvasUpdate = useCallback((updates) => {
    setDraft((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        canvas: {
          ...prev.layout.canvas,
          ...updates
        }
      }
    }));
  }, []);

  const handleLinkStyleUpdate = useCallback((updates) => {
    setDraft((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        linkStyle: {
          ...prev.layout.linkStyle,
          ...updates
        }
      }
    }));
  }, []);

  const handlePaletteChange = useCallback((mode, field, value) => {
    setDraft((prev) => ({
      ...prev,
      palette: {
        ...prev.palette,
        [mode]: {
          ...(prev.palette?.[mode] || {}),
          [field]: value
        }
      }
    }));
  }, []);

  const startCanvasWidthDrag = useCallback(
    (event) => {
      event.preventDefault();
      const startX = event.clientX;
      const baseWidth = draft?.layout?.canvas?.maxWidth ?? defaultDesign.layout.canvas.maxWidth;

      const onPointerMove = (moveEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth = clamp(baseWidth + delta, 360, 1280);
        handleCanvasUpdate({ maxWidth: Math.round(nextWidth) });
      };

      const stop = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', stop);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', stop, { once: true });
    },
    [draft?.layout?.canvas?.maxWidth, handleCanvasUpdate]
  );

  const startCanvasPaddingDrag = useCallback(
    (event) => {
      event.preventDefault();
      const startY = event.clientY;
      const basePadding = draft?.layout?.canvas?.paddingY ?? defaultDesign.layout.canvas.paddingY;

      const onPointerMove = (moveEvent) => {
        const delta = startY - moveEvent.clientY;
        const nextPadding = clamp(basePadding + delta, 48, 240);
        handleCanvasUpdate({ paddingY: Math.round(nextPadding) });
      };

      const stop = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', stop);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', stop, { once: true });
    },
    [draft?.layout?.canvas?.paddingY, handleCanvasUpdate]
  );

  const startButtonWidthDrag = useCallback(
    (event) => {
      event.preventDefault();
      const startX = event.clientX;
      const basePadding = draft?.layout?.linkStyle?.paddingX ?? defaultDesign.layout.linkStyle.paddingX;

      const onPointerMove = (moveEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextPadding = clamp(basePadding + delta / 2, 16, 80);
        handleLinkStyleUpdate({ paddingX: Math.round(nextPadding) });
      };

      const stop = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', stop);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', stop, { once: true });
    },
    [draft?.layout?.linkStyle?.paddingX, handleLinkStyleUpdate]
  );

  const startButtonHeightDrag = useCallback(
    (event) => {
      event.preventDefault();
      const startY = event.clientY;
      const basePadding = draft?.layout?.linkStyle?.paddingY ?? defaultDesign.layout.linkStyle.paddingY;

      const onPointerMove = (moveEvent) => {
        const delta = moveEvent.clientY - startY;
        const nextPadding = clamp(basePadding + delta / 2, 12, 64);
        handleLinkStyleUpdate({ paddingY: Math.round(nextPadding) });
      };

      const stop = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', stop);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', stop, { once: true });
    },
    [draft?.layout?.linkStyle?.paddingY, handleLinkStyleUpdate]
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
  const canvasValues = draft?.layout?.canvas || defaultDesign.layout.canvas;
  const linkStyleValues = draft?.layout?.linkStyle || defaultDesign.layout.linkStyle;
  const paletteValues = draft?.palette?.[paletteMode] || defaultDesign.palette[paletteMode];
  const previewCanvasWidth = Math.round(clamp((canvasValues?.maxWidth || 900) / 2, 260, 520));

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

  const handleBackgroundGradientChange = (value) => {
    setDraft((prev) => ({
      ...prev,
      background: {
        ...prev.background,
        customGradient: value
      }
    }));
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

  const handleLinkGradientChange = (value) => {
    handleLinkStyleUpdate({ customGradient: value });
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
          linkStyle: { ...draft.layout.linkStyle },
          canvas: { ...draft.layout.canvas }
        },
        palette: {
          ...draft.palette,
          dark: { ...(draft.palette?.dark || {}) },
          light: { ...(draft.palette?.light || {}) }
        }
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
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Degradado CSS manual</label>
                  <textarea
                    value={draft.background.customGradient || ''}
                    onChange={(event) => handleBackgroundGradientChange(event.target.value)}
                    placeholder="linear-gradient(135deg, rgba(15,23,42,0.8), rgba(147,51,234,0.8))"
                    className="h-16 w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:border-indigo-400 focus:outline-none"
                  />
                  <p className="text-[11px] leading-snug text-slate-400">
                    Si se define, se utilizará este valor exacto. Deja el campo vacío para generar el degradado automáticamente.
                  </p>
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Paleta por modo</h3>
              <p className="text-sm text-slate-300">Ajusta colores para los modos oscuro y claro del landing.</p>
            </div>
            <div className="flex gap-2">
              {['dark', 'light'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaletteMode(mode)}
                  className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition ${
                    paletteMode === mode
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'border border-white/20 bg-white/10 text-white/70 hover:border-indigo-400 hover:text-white'
                  }`}
                >
                  {mode === 'dark' ? 'Modo oscuro' : 'Modo claro'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Texto principal</label>
                <input
                  type="color"
                  value={paletteValues?.text || (paletteMode === 'dark' ? '#f8fafc' : '#0f172a')}
                  onChange={(event) => handlePaletteChange(paletteMode, 'text', event.target.value)}
                  className="h-10 w-full cursor-pointer rounded-full border border-white/20 bg-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Texto secundario</label>
                <input
                  type="color"
                  value={paletteValues?.textMuted || (paletteMode === 'dark' ? '#cbd5f5' : '#334155')}
                  onChange={(event) => handlePaletteChange(paletteMode, 'textMuted', event.target.value)}
                  className="h-10 w-full cursor-pointer rounded-full border border-white/20 bg-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Superficie</label>
                <input
                  type="text"
                  value={paletteValues?.surface || ''}
                  onChange={(event) => handlePaletteChange(paletteMode, 'surface', event.target.value)}
                  placeholder={paletteMode === 'dark' ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.9)'}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Cristal</label>
                <input
                  type="text"
                  value={paletteValues?.glass || ''}
                  onChange={(event) => handlePaletteChange(paletteMode, 'glass', event.target.value)}
                  placeholder={paletteMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:border-indigo-400 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] leading-snug text-slate-400">
              Estos valores controlan los contrastes para cada modo. Usa formatos HEX o RGBA para superficies translúcidas.
            </p>
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
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Degradado CSS de los botones</label>
              <textarea
                value={draft.layout.linkStyle.customGradient || ''}
                onChange={(event) => handleLinkGradientChange(event.target.value)}
                placeholder="linear-gradient(135deg, rgba(99,102,241,0.65), rgba(244,114,182,0.7))"
                className="h-16 w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:border-indigo-400 focus:outline-none"
              />
              <p className="text-[11px] leading-snug text-slate-400">
                Define un degradado completo en CSS o deja el campo vacío para generar uno automático según los colores del fondo.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Texto modo oscuro</label>
                <input
                  type="color"
                  value={draft.layout.linkStyle.textColorDark || '#f9fafb'}
                  onChange={(event) => handleLinkStyleUpdate({ textColorDark: event.target.value })}
                  className="h-10 w-full cursor-pointer rounded-full border border-white/20 bg-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Texto modo claro</label>
                <input
                  type="color"
                  value={draft.layout.linkStyle.textColorLight || '#0f172a'}
                  onChange={(event) => handleLinkStyleUpdate({ textColorLight: event.target.value })}
                  className="h-10 w-full cursor-pointer rounded-full border border-white/20 bg-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Acento modo oscuro</label>
                <input
                  type="color"
                  value={draft.layout.linkStyle.accentColorDark || '#a855f7'}
                  onChange={(event) => handleLinkStyleUpdate({ accentColorDark: event.target.value })}
                  className="h-10 w-full cursor-pointer rounded-full border border-white/20 bg-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Acento modo claro</label>
                <input
                  type="color"
                  value={draft.layout.linkStyle.accentColorLight || '#6d28d9'}
                  onChange={(event) => handleLinkStyleUpdate({ accentColorLight: event.target.value })}
                  className="h-10 w-full cursor-pointer rounded-full border border-white/20 bg-transparent"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Separación entre botones</label>
              <input
                type="range"
                min="8"
                max="60"
                value={Math.round(draft.layout.linkStyle.gap ?? linkStyleValues.gap ?? 20)}
                onChange={(event) => handleLinkStyleUpdate({ gap: Number(event.target.value) })}
              />
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

        <div className="glass-card bg-slate-950/60 text-white">
          <h3 className="text-lg font-semibold">Tamaños interactivos</h3>
          <p className="mt-1 text-sm text-slate-300">Arrastra los controladores para ajustar el ancho del lienzo y la dimensión de los botones.</p>

          <div className="mt-5 space-y-6">
            <div
              ref={previewContainerRef}
              className="relative mx-auto flex min-h-[180px] w-full max-w-[520px] flex-col items-center justify-center rounded-[32px] border border-dashed border-white/20 bg-white/5 px-6 py-10 text-xs uppercase tracking-[0.25em] text-white/70"
              style={{ width: `${previewCanvasWidth}px` }}
            >
              <span>Ancho actual · {canvasValues.maxWidth}px · Padding vertical {canvasValues.paddingY}px</span>
              <button
                type="button"
                onPointerDown={startCanvasWidthDrag}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full border border-indigo-300/60 bg-indigo-500/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white shadow-lg"
              >
                ⇔
              </button>
              <button
                type="button"
                onPointerDown={startCanvasPaddingDrag}
                className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-300/60 bg-indigo-500/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white shadow-lg"
              >
                ⇕
              </button>
            </div>

            <div className="relative mx-auto w-full max-w-[360px]">
              <div
                ref={buttonDemoRef}
                className="relative mx-auto flex max-w-full flex-col items-center gap-3"
              >
                <div
                  className="w-full rounded-full border border-white/20 bg-white/10 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white/80"
                  style={{ padding: `${linkStyleValues.paddingY || 18}px ${linkStyleValues.paddingX || 28}px` }}
                >
                  Botón de muestra
                </div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                  Padding: {linkStyleValues.paddingY}px · {linkStyleValues.paddingX}px
                </div>
                <button
                  type="button"
                  onPointerDown={startButtonWidthDrag}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full border border-indigo-300/60 bg-indigo-500/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white shadow-lg"
                >
                  ⇔
                </button>
                <button
                  type="button"
                  onPointerDown={startButtonHeightDrag}
                  className="absolute left-1/2 bottom-0 translate-y-1/2 -translate-x-1/2 rounded-full border border-indigo-300/60 bg-indigo-500/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white shadow-lg"
                >
                  ⇕
                </button>
              </div>
            </div>
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
