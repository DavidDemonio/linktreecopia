import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';

const defaultForm = {
  name: '',
  slug: '',
  color: '#6366F1'
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

export default function CategoryFormModal({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({ ...defaultForm, ...initialData });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [initialData, open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      const details = error.details?.details || [];
      const nextErrors = {};
      details.forEach((detail) => {
        nextErrors[detail.path] = detail.message;
      });
      setErrors(nextErrors);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-4" enterTo="opacity-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-4">
              <Dialog.Panel className="glass-card w-full max-w-lg bg-slate-900/80 p-6 text-white">
                <Dialog.Title className="text-2xl font-semibold">
                  {initialData ? 'Editar categoría' : 'Nueva categoría'}
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <Field label="Nombre" error={errors.name}>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                          slug: prev.slug || slugify(event.target.value)
                        }))
                      }
                      className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      required
                    />
                  </Field>
                  <Field label="Slug" error={errors.slug}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(event) => setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
                        className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, slug: slugify(prev.name) }))}
                        className="rounded-2xl border border-white/20 px-3 py-2 text-xs uppercase tracking-wide hover:border-indigo-400"
                      >
                        Auto
                      </button>
                    </div>
                  </Field>
                  <Field label="Color" error={errors.color}>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.color}
                        onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                        className="h-12 w-16 rounded-xl border border-white/20 bg-white/10"
                      />
                      <input
                        type="text"
                        value={form.color}
                        onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                        className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                  </Field>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-2xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:border-white/40"
                    >
                      Cancelar
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="rounded-2xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-400"
                    >
                      Guardar
                    </motion.button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-slate-200">{label}</span>
      {children}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  );
}
