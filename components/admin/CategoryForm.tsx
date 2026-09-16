'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/catalog';
import type { CategoryOption } from '@/lib/admin';
import { ImagePicker } from './ImagePicker';

export function CategoryForm({
  category,
  categories,
}: {
  category?: Category;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? '');
  const [parent, setParent] = useState<number>(category?.parent ?? 0);
  const [description, setDescription] = useState(category?.description ?? '');
  const [image, setImage] = useState(category?.image ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { name, parent, description, image };
    try {
      const url = isEdit ? `/api/admin/categories/${category!.id}` : '/api/admin/categories';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push('/admin/categorias');
        router.refresh();
      } else {
        setError(data.error || 'No se pudo guardar');
        setSaving(false);
      }
    } catch {
      setError('Error de conexión');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card">
      <h2 className="admin-card__title">{isEdit ? 'Editar categoría' : 'Nueva categoría'}</h2>
      <div className="form-grid">
        <div className="form-field form-field--full">
          <label htmlFor="cat-name">Nombre</label>
          <input id="cat-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="cat-parent">Categoría padre</label>
          <select id="cat-parent" value={parent} onChange={(e) => setParent(Number(e.target.value))}>
            <option value={0}>— Sin padre (raíz) —</option>
            {categories
              .filter((c) => c.id !== category?.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {'\u00A0\u00A0'.repeat(c.depth)}
                  {c.name}
                </option>
              ))}
          </select>
        </div>
        <div className="form-field form-field--full">
          <label>Imagen de la categoría</label>
          <ImagePicker value={image} onChange={setImage} />
        </div>
        <div className="form-field form-field--full">
          <label htmlFor="cat-desc">Descripción</label>
          <textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      {error && <p className="admin-login__error">{error}</p>}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="btn btn--red" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => router.push('/admin/categorias')}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
