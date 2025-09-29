import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Squares2X2Icon, LinkIcon, ChartBarIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import { useAdmin } from '../context/AdminContext.jsx';

const navItems = [
  { to: 'links', label: 'Links', icon: LinkIcon },
  { to: 'categories', label: 'Categorías', icon: Squares2X2Icon },
  { to: 'analytics', label: 'Analítica', icon: ChartBarIcon },
  { to: 'settings', label: 'Ajustes', icon: Cog6ToothIcon }
];

export default function AdminLayout() {
  const { user, logout } = useAdmin();
  return (
    <div className="flex min-h-screen bg-slate-950/95 text-white">
      <aside className="hidden w-72 flex-col border-r border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl lg:flex">
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Panel</h1>
          <ThemeToggle />
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `glass-card flex items-center gap-3 border-white/5 bg-white/5 px-4 py-3 text-sm font-medium hover:border-indigo-400 hover:bg-indigo-500/20 ${
                  isActive ? 'border-indigo-400 bg-indigo-500/30 text-white shadow-glow' : 'text-slate-200'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-red-500/80 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Cerrar sesión
        </button>
      </aside>
      <main className="flex-1 bg-white/10 p-6 backdrop-blur-xl dark:bg-slate-900/40">
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <div>
            <h1 className="text-2xl font-semibold">Panel de control</h1>
            <p className="text-sm text-slate-300">Hola {user?.username}</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="hidden items-center justify-between lg:flex">
          <div>
            <h1 className="text-3xl font-semibold">Panel de control</h1>
            <p className="text-sm text-slate-300">Hola {user?.username}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-2xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:border-red-400 hover:text-white"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
        <section className="mt-8">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
