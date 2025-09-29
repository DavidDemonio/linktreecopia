import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext.jsx';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, loading, user } = useAdmin();
  const [form, setForm] = useState({ user: '', pass: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/admin');
    }
  }, [loading, user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(form);
      navigate('/admin');
    } catch (error) {
      // handled by toasts
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="glass-card w-full max-w-md bg-slate-900/60 p-8 text-white">
        <h1 className="mb-2 text-3xl font-semibold">Bienvenido</h1>
        <p className="mb-8 text-sm text-slate-300">Accede con tus credenciales para gestionar tus enlaces.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Usuario</label>
            <input
              type="text"
              value={form.user}
              onChange={(event) => setForm((prev) => ({ ...prev, user: event.target.value }))}
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Contraseña</label>
            <input
              type="password"
              value={form.pass}
              onChange={(event) => setForm((prev) => ({ ...prev, pass: event.target.value }))}
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
