import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { useAdmin } from '../context/AdminContext.jsx';
import { useToasts } from '../context/ToastContext.jsx';

const ranges = [
  { label: 'Últimos 7 días', value: '7d' },
  { label: 'Últimos 30 días', value: '30d' },
  { label: 'Todo', value: 'all' }
];

export default function AnalyticsPage() {
  const { apiFetch } = useAdmin();
  const { pushToast } = useToasts();
  const [links, setLinks] = useState([]);
  const [selectedLink, setSelectedLink] = useState(null);
  const [range, setRange] = useState(ranges[0]);
  const [stats, setStats] = useState({ totalClicks: 0, daily: [] });
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function loadLinks() {
      try {
        const response = await apiFetch('/admin/api/links');
        const data = (response.data || []).sort((a, b) => a.order - b.order);
        setLinks(data);
        setSelectedLink(data[0] || null);
      } catch (error) {
        pushToast({ title: 'Error cargando enlaces', description: error.message, type: 'error' });
      }
    }
    loadLinks();
  }, []);

  useEffect(() => {
    if (!selectedLink) return;
    let cancelled = false;
    async function loadStats() {
      setLoading(true);
      try {
        const response = await apiFetch(`/admin/api/stats/links/${selectedLink.id}?range=${range.value}`);
        if (!cancelled) {
          setStats(response.data);
        }
      } catch (error) {
        pushToast({ title: 'Error cargando estadísticas', description: error.message, type: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, [selectedLink, range, apiFetch, pushToast]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { daily } = stats;
    const padding = 30;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!daily || daily.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '14px sans-serif';
      ctx.fillText('Sin datos', width / 2 - 30, height / 2);
      return;
    }

    const maxValue = Math.max(...daily.map((item) => item.total), 1);
    const stepX = (width - padding * 2) / Math.max(daily.length - 1, 1);

    ctx.strokeStyle = 'rgba(129,140,248,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    daily.forEach((point, index) => {
      const x = padding + stepX * index;
      const y = height - padding - (point.total / maxValue) * (height - padding * 2);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.fillStyle = 'rgba(99,102,241,0.8)';
    daily.forEach((point, index) => {
      const x = padding + stepX * index;
      const y = height - padding - (point.total / maxValue) * (height - padding * 2);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(148,163,184,0.8)';
    ctx.font = '10px sans-serif';
    daily.forEach((point, index) => {
      const x = padding + stepX * index;
      const y = height - padding - (point.total / maxValue) * (height - padding * 2) - 8;
      ctx.fillText(`${point.date.split('-').slice(1).join('/')}`, x - 14, height - 10);
      ctx.fillText(`${point.total}`, x - 6, y);
    });
  }, [stats]);

  const uniqueSummary = useMemo(() => {
    const lastSeven = stats.daily.slice(-7);
    const lastThirty = stats.daily.slice(-30);
    const sum = (items) => items.reduce((acc, item) => acc + (item.uniques || 0), 0);
    return {
      lastSeven: sum(lastSeven),
      lastThirty: sum(lastThirty)
    };
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Analítica</h2>
          <p className="text-sm text-slate-300">Observa el rendimiento de tus enlaces.</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-inner">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Listbox value={selectedLink} onChange={setSelectedLink}>
            <div className="relative w-full md:w-72">
              <Listbox.Button className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-left text-sm focus:outline-none">
                {selectedLink ? selectedLink.title : 'Selecciona un enlace'}
                <ChevronUpDownIcon className="h-4 w-4" />
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/90 p-2 text-sm shadow-xl">
                {links.map((link) => (
                  <Listbox.Option
                    key={link.id}
                    value={link}
                    className={({ active }) =>
                      `flex items-center justify-between rounded-xl px-3 py-2 ${active ? 'bg-indigo-500/30' : ''}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span>{link.title}</span>
                        {selected && <CheckIcon className="h-4 w-4" />}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>

          <Listbox value={range} onChange={setRange}>
            <div className="relative w-full md:w-48">
              <Listbox.Button className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-left text-sm focus:outline-none">
                {range.label}
                <ChevronUpDownIcon className="h-4 w-4" />
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/90 p-2 text-sm shadow-xl">
                {ranges.map((item) => (
                  <Listbox.Option
                    key={item.value}
                    value={item}
                    className={({ active }) =>
                      `flex items-center justify-between rounded-xl px-3 py-2 ${active ? 'bg-indigo-500/30' : ''}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span>{item.label}</span>
                        {selected && <CheckIcon className="h-4 w-4" />}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Clicks totales" value={stats.totalClicks} subtitle="Acumulado histórico" />
          <StatCard title="Únicos 7 días" value={uniqueSummary.lastSeven} subtitle="Visitantes únicos" />
          <StatCard title="Únicos 30 días" value={uniqueSummary.lastThirty} subtitle="Visitantes únicos" />
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
            <span>{loading ? 'Cargando...' : `${stats.daily.length} días analizados`}</span>
            <span>Datos de clicks totales</span>
          </div>
          <canvas ref={canvasRef} width={720} height={280} className="w-full" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }) {
  return (
    <div className="glass-card bg-slate-900/60 p-4 text-white">
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}
