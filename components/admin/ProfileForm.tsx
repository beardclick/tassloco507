'use client';

import { useState, type FormEvent } from 'react';
import { PasswordInput } from '@/components/PasswordInput';

export function ProfileForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMessage('Contraseña actualizada correctamente.');
        setPassword('');
        setConfirm('');
      } else {
        setError(data.error || 'No se pudo actualizar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card">
      <h2 className="admin-card__title">Cambiar contraseña</h2>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="pf-pass">Nueva contraseña</label>
          <PasswordInput id="pf-pass" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="pf-confirm">Confirmar contraseña</label>
          <PasswordInput id="pf-confirm" minLength={6} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
      </div>
      {error && <p className="admin-login__error" style={{ marginTop: 12 }}>{error}</p>}
      {message && <p className="admin-muted" style={{ marginTop: 12 }}>{message}</p>}
      <button className="btn btn--red" disabled={saving} style={{ marginTop: 16 }}>
        {saving ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}
