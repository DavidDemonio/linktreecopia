import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const defaultForm = {
  title: '',
  url: '',
  slug: '',
  description: '',
  icon: '',
  categories: [],
  active: true,
  order: 0
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

export default function LinkFormModal({ open, onClose, onSave, categories, initialData }) {
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

  const toggleCategory = (slug) => {
    setForm((prev) => {
      const exists = prev.categories.includes(slug);
      return {
        ...prev,
        categories: exists ? prev.categories.filter((item) => item !== slug) : [...prev.categories, slug]
      };
    });
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="glass-card w-full max-w-2xl bg-slate-900/80 p-6 text-white">
                <Dialog.Title className="text-2xl font-semibold">
                  {initialData ? 'Editar enlace' : 'Nuevo enlace'}
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Título" error={errors.title}>
                      <input
                        type="text"
                        className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        value={form.title}
                        onChange={(event) => {
                          const value = event.target.value;
                          setForm((prev) => ({
                            ...prev,
                            title: value,
                            slug: prev.slug || slugify(value)
                          }));
                        }}
                        required
                      />
                    </Field>
                    <Field label="Slug" error={errors.slug}>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          value={form.slug}
                          onChange={(event) => setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, slug: slugify(prev.title) }))}
                          className="rounded-2xl border border-white/20 px-3 py-2 text-xs uppercase tracking-wide hover:border-indigo-400"
                        >
                          Auto
                        </button>
                      </div>
                    </Field>
                  </div>

                  <Field label="URL" error={errors.url}>
                    <input
                      type="url"
                      className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={form.url}
                      onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
                      required
                    />
                  </Field>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Descripción" error={errors.description}>
                      <textarea
                        rows={3}
                        className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        value={form.description}
                        onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                      />
                    </Field>
                    <Field label="Icono / Emoji" error={errors.icon}>
                      <input
                        type="text"
                        className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        value={form.icon}
                        onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
                      />
                    </Field>
                  </div>

                  <Field label="Categorías">
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => {
                        const active = form.categories.includes(category.slug);
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => toggleCategory(category.slug)}
                            className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                              active
                                ? 'border-transparent bg-indigo-500/90 text-white shadow-lg'
                                : 'border-white/20 bg-white/10 text-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            {category.name}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Orden" error={errors.order}>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        value={form.order}
                        onChange={(event) => setForm((prev) => ({ ...prev, order: Number(event.target.value) }))}
                      />
                    </Field>
                    <Field label="Estado">
                      <Listbox value={form.active} onChange={(value) => setForm((prev) => ({ ...prev, active: value }))}>
                        <div className="relative">
                          <Listbox.Button className="flex w-full items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left text-sm focus:outline-none">
                            {form.active ? 'Activo' : 'Oculto'}
                            <ChevronUpDownIcon className="h-4 w-4" />
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/90 p-2 text-sm shadow-xl">
                              {[{ label: 'Activo', value: true }, { label: 'Oculto', value: false }].map((item) => (
                                <Listbox.Option
                                  key={item.value.toString()}
                                  value={item.value}
                                  className={({ active }) =>
                                    `flex items-center justify-between rounded-xl px-3 py-2 ${active ? 'bg-indigo-500/40' : ''}`
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
                          </Transition>
                        </div>
                      </Listbox>
                    </Field>
                  </div>

                  {errors.root && <p className="text-sm text-red-400">{errors.root}</p>}

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
