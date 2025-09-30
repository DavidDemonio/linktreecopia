import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function LinkRedirect() {
  const { slug } = useParams();
  const [status, setStatus] = useState('redirecting');

  useEffect(() => {
    if (!slug) {
      setStatus('error');
      return;
    }

    let cancelled = false;

    const verifyAndRedirect = async () => {
      try {
        const response = await fetch('/api/links');
        if (!response.ok) {
          throw new Error('Links request failed');
        }
        const payload = await response.json();
        const link = (payload.data || []).find((item) => item.slug === slug && item.active);

        if (cancelled) {
          return;
        }

        if (link) {
          window.location.replace(`/api/go/${encodeURIComponent(slug)}`);
        } else {
          setStatus('not-found');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
        }
      }
    };

    verifyAndRedirect();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === 'redirecting') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <p className="text-center text-lg">Redirigiendo…</p>
      </main>
    );
  }

  if (status === 'not-found') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Enlace no encontrado</h1>
          <p className="mt-2">Este enlace podría estar desactivado o no existir.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">No se pudo redirigir</h1>
        <p className="mt-2">Inténtalo de nuevo más tarde.</p>
      </div>
    </main>
  );
}
