import React from 'react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Ajustes</h2>
        <p className="text-sm text-slate-300">Configura tu panel y credenciales.</p>
      </div>
      <div className="glass-card bg-slate-900/60 p-6 text-white">
        <h3 className="text-lg font-semibold">Credenciales del administrador</h3>
        <p className="mt-2 text-sm text-slate-300">
          Las credenciales de acceso se definen en el archivo <code>.env</code> en el servidor:
        </p>
        <pre className="mt-4 rounded-2xl bg-black/40 p-4 text-xs">
ADMIN_USER=admin
ADMIN_PASS=admin123
SESSION_SECRET=supersecret
        </pre>
        <p className="mt-4 text-sm text-slate-300">
          Modifica estos valores y reinicia el servidor para aplicar cambios. También puedes definir <code>HASH_SALT</code> para el
          cálculo de visitantes únicos.
        </p>
      </div>
    </div>
  );
}
