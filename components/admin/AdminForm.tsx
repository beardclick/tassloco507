'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Admin } from '@/lib/db';

export function AdminForm({ admin }: { admin?: Admin }) {
  const router = useRouter();
  const isEdit = Boolean(admin);
  const [nombre, setNombre] = useState(admin?.nombre ?? '');
  const [email, setEmail] = useState(admin?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = isEdit ? `/api/admin/admins/${admin!.id}` : '/api/admin/admins';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push('/admin/administradores');
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
      <h2 className="admin-card__title">{isEdit ? 'Editar administrador' : 'Nuevo administrador'}</h2>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="a-nombre">Nombre</label>
          <input id="a-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="a-email">Correo</label>
          <input id="a-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-field form-field--full">
          <label htmlFor="a-pass">
            {isEdit ? 'Nueva contraseña (opcional — déjala vacía para no cambiarla)' : 'Contraseña'}
          </label>
          <input
            id="a-pass"
            type="password"
            minLength={6}
            required={!isEdit}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </div>
      </div>

      {error && <p className="admin-login__error">{error}</p>}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="btn btn--red" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => router.push('/admin/administradores')}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
