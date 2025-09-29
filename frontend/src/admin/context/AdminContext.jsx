import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useToasts } from './ToastContext.jsx';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToasts();

  const fetchCsrf = useCallback(async () => {
    const response = await fetch('/admin/api/csrf', { credentials: 'include' });
    const json = await response.json();
    setCsrfToken(json.data?.token);
    return json.data?.token;
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await fetchCsrf();
        if (token) {
          const meRes = await fetch('/admin/api/me', { credentials: 'include' });
          if (meRes.ok) {
            const json = await meRes.json();
            setUser(json.data);
          }
        }
      } catch (error) {
        console.error('Error loading admin session', error);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [fetchCsrf]);

  const apiFetch = useCallback(
    async (url, options = {}) => {
      const opts = {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      };
      if (options.method && options.method !== 'GET') {
        const token = csrfToken || (await fetchCsrf());
        opts.headers['X-CSRF-Token'] = token;
      }
      const response = await fetch(url, opts);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const error = new Error(errorBody?.error?.message || 'Error en la solicitud');
        error.details = errorBody?.error;
        throw error;
      }
      return response.json();
    },
    [csrfToken, fetchCsrf]
  );

  const login = useCallback(
    async ({ user: username, pass }) => {
      try {
        const token = csrfToken || (await fetchCsrf());
        const response = await fetch('/admin/api/login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token
          },
          body: JSON.stringify({ user: username, pass })
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(errorBody?.error?.message || 'No se pudo iniciar sesión');
        }
        const json = await response.json();
        setUser(json.data.user);
        pushToast({ title: 'Sesión iniciada', description: 'Bienvenido al panel.', type: 'success' });
        await fetchCsrf();
        return json.data.user;
      } catch (error) {
        pushToast({ title: 'Error', description: error.message, type: 'error' });
        throw error;
      }
    },
    [csrfToken, fetchCsrf, pushToast]
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/admin/api/logout', { method: 'POST' });
      setUser(null);
      pushToast({ title: 'Sesión cerrada', type: 'success' });
    } catch (error) {
      pushToast({ title: 'Error al cerrar sesión', description: error.message, type: 'error' });
    }
  }, [apiFetch, pushToast]);

  const refresh = useCallback(async () => {
    await fetchCsrf();
    const meRes = await fetch('/admin/api/me', { credentials: 'include' });
    if (meRes.ok) {
      const json = await meRes.json();
      setUser(json.data);
    } else {
      setUser(null);
    }
  }, [fetchCsrf]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      apiFetch,
      refresh
    }),
    [user, loading, login, logout, apiFetch, refresh]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  return useContext(AdminContext);
}
