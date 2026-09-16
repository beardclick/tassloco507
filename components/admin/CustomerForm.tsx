'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer } from '@/lib/db';

export function CustomerForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(customer.nombre);
  const [apellido, setApellido] = useState(customer.apellido);
  const [email, setEmail] = useState(customer.email);
  const [telefono, setTelefono] = useState(customer.telefono);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, email, telefono, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push('/admin/clientes');
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
      <h2 className="admin-card__title">Editar cliente</h2>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="c-nombre">Nombre</label>
          <input id="c-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="c-apellido">Apellido</label>
          <input id="c-apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="c-email">Correo</label>
          <input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="c-tel">Teléfono / WhatsApp</label>
          <input id="c-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
        <div className="form-field form-field--full">
          <label htmlFor="c-pass">Nueva contraseña (opcional — déjala vacía para no cambiarla)</label>
          <input
            id="c-pass"
            type="password"
            minLength={6}
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
        <button type="button" className="btn btn--ghost" onClick={() => router.push('/admin/clientes')}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
