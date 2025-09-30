import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { useAdmin } from '../context/AdminContext.jsx';
import { useToasts } from '../context/ToastContext.jsx';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const ranges = [
  { label: 'Últimos 7 días', value: '7d' },
  { label: 'Últimos 30 días', value: '30d' },
  { label: 'Todo', value: 'all' }
];

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const numberFormatter = new Intl.NumberFormat('es-ES');

export default function AnalyticsPage() {
  const { apiFetch } = useAdmin();
  const { pushToast } = useToasts();
  const [links, setLinks] = useState([]);
  const [selectedLink, setSelectedLink] = useState(null);
  const [range, setRange] = useState(ranges[0]);
  const [stats, setStats] = useState({ totalClicks: 0, daily: [], countries: [], referrers: [] });
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

  const countryRanking = useMemo(() => {
    const sorted = [...(stats.countries || [])].sort((a, b) => (b.total || 0) - (a.total || 0));
    return sorted.map((country, index) => ({
      ...country,
      rank: index + 1
    }));
  }, [stats.countries]);

  const topCountries = useMemo(() => countryRanking.slice(0, 6), [countryRanking]);

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

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WorldMapCard countries={countryRanking} loading={loading} />
          </div>
          <div className="flex flex-col gap-4">
            <CountryBarChart countries={topCountries} loading={loading} />
            <ReferrerList referrers={stats.referrers} loading={loading} />
          </div>
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

function WorldMapCard({ countries, loading }) {
  const [hoveredCode, setHoveredCode] = useState(null);
  const lookup = useMemo(() => {
    const map = new Map();
    countries.forEach((country) => {
      if (country.code) {
        map.set(country.code, country);
      }
    });
    return map;
  }, [countries]);

  const maxValue = useMemo(() => {
    return countries.reduce((acc, country) => Math.max(acc, country.total || 0), 0);
  }, [countries]);

  const hoveredCountry = hoveredCode ? lookup.get(hoveredCode) : null;

  return (
    <div className="h-full rounded-3xl border border-white/10 bg-slate-900/60 p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 text-sm text-slate-300">
        <div>
          <p className="font-medium text-white">Mapa mundial de visitas</p>
          <p className="text-xs text-slate-400">
            {loading ? 'Calculando...' : 'Resalta la distribución geográfica de tus visitantes.'}
          </p>
        </div>
        {hoveredCountry && (
          <div className="text-right text-xs text-slate-300">
            <p className="font-semibold text-white">{hoveredCountry.name || hoveredCountry.code}</p>
            <p>{numberFormatter.format(hoveredCountry.total || 0)} visitas</p>
            <p className="text-slate-400">
              {numberFormatter.format(hoveredCountry.uniques || 0)} visitantes únicos
            </p>
          </div>
        )}
      </div>
      <div className="overflow-hidden rounded-2xl bg-slate-950/40">
        <ComposableMap projectionConfig={{ scale: 140 }} className="w-full">
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const code = geo.properties.ISO_A2;
                const data = lookup.get(code);
                const intensity = data ? data.total || 0 : 0;
                const fill = getCountryColor(intensity, maxValue);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHoveredCode(code || null)}
                    onMouseLeave={() => setHoveredCode(null)}
                    style={{
                      default: { fill, outline: 'none', stroke: 'rgba(148, 163, 184, 0.2)', strokeWidth: 0.5 },
                      hover: { fill: '#818cf8', outline: 'none' },
                      pressed: { fill: '#6366f1', outline: 'none' }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
        <span>Menos</span>
        <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-slate-700 via-indigo-500 to-indigo-300" />
        <span>Más</span>
      </div>
    </div>
  );
}

function CountryBarChart({ countries, loading }) {
  const maxValue = useMemo(() => {
    return countries.reduce((acc, country) => Math.max(acc, country.total || 0), 0);
  }, [countries]);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">
      <div className="mb-4">
        <p className="font-medium text-white">Países destacados</p>
        <p className="text-xs text-slate-400">
          {loading ? 'Actualizando...' : 'Top visitantes según volumen de clicks.'}
        </p>
      </div>
      <div className="space-y-3">
        {countries.length === 0 ? (
          <p className="text-xs text-slate-400">Aún no hay datos suficientes.</p>
        ) : (
          countries.map((country) => {
            const percentage = maxValue > 0 ? Math.round((country.total / maxValue) * 100) : 0;
            return (
              <div key={country.code} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white">
                    {country.rank ? `${country.rank}. ` : ''}
                    {country.name || country.code}
                  </span>
                  <span>{numberFormatter.format(country.total || 0)} clicks</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-300"
                    style={{ width: `${Math.max(6, percentage)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {numberFormatter.format(country.uniques || 0)} visitantes únicos
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ReferrerList({ referrers = [], loading }) {
  const topReferrers = useMemo(() => referrers.slice(0, 6), [referrers]);
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">
      <div className="mb-4">
        <p className="font-medium text-white">Fuentes principales</p>
        <p className="text-xs text-slate-400">
          {loading
            ? 'Cargando...'
            : 'Lugares desde donde llegaron tus visitantes más recientes.'}
        </p>
      </div>
      {topReferrers.length === 0 ? (
        <p className="text-xs text-slate-400">Sin referencias registradas todavía.</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {topReferrers.map((referrer) => (
            <li
              key={referrer.source}
              className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-white/90"
            >
              <span className="truncate pr-2">{referrer.label || referrer.source}</span>
              <span className="text-slate-300">
                {numberFormatter.format(referrer.total || 0)} ·{' '}
                {numberFormatter.format(referrer.uniques || 0)} únicos
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function getCountryColor(value, max) {
  if (!max || !value) {
    return '#1e293b';
  }
  const ratio = Math.min(1, value / max);
  const start = [30, 41, 59];
  const end = [99, 102, 241];
  const channel = start.map((component, index) => {
    const target = end[index];
    return Math.round(component + (target - component) * ratio);
  });
  return `rgb(${channel[0]}, ${channel[1]}, ${channel[2]})`;
}
