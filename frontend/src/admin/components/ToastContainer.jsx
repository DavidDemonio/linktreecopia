import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useToasts } from '../context/ToastContext.jsx';

export default function ToastContainer() {
  const { toasts, dismissToast } = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto glass-card flex min-w-[240px] items-center gap-3 bg-slate-900/90 text-white shadow-xl ${
            toast.type === 'error' ? 'border-red-500/60' : 'border-emerald-400/60'
          }`}
        >
          <div className="flex-1">
            <p className="font-semibold">{toast.title}</p>
            {toast.description && <p className="text-sm opacity-80">{toast.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="rounded-full bg-white/10 p-1 transition hover:bg-white/20"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
