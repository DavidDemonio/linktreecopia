import React from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import { AdminProvider, useAdmin } from './context/AdminContext.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import LinksPage from './pages/LinksPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function ProtectedRoute() {
  const { user, loading } = useAdmin();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950/90 text-white">
        Cargando panel...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}

export default function AdminApp() {
  return (
    <ToastProvider>
      <AdminProvider>
        <ToastContainer />
        <Routes>
          <Route path="login" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="links" replace />} />
              <Route path="links" element={<LinksPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </AdminProvider>
    </ToastProvider>
  );
}
