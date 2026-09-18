'use client';

import { useState, type FormEvent } from 'react';

export function NotificationForm({ emails }: { emails: string[] }) {
  const [value, setValue] = useState(emails.join('\n'));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    const list = value
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: list }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setValue((data.emails ?? []).join('\n'));
        setMessage('Correos actualizados correctamente.');
      } else {
        setError(data.error || 'No se pudo guardar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card">
      <h2 className="admin-card__title">Correos de pedidos</h2>
      <p className="admin-muted">
        Estos correos recibirán el aviso de cada nuevo pedido. Puedes poner uno o varios —{' '}
        <strong>un email por línea</strong>.
      </p>
      <div className="form-field">
        <label htmlFor="notif-emails">Destinatarios</label>
        <textarea
          id="notif-emails"
          rows={5}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="tassloco507@gmail.com"
        />
      </div>
      {error && <p className="admin-login__error" style={{ marginTop: 12 }}>{error}</p>}
      {message && <p className="admin-muted" style={{ marginTop: 12 }}>{message}</p>}
      <button className="btn btn--red" disabled={saving} style={{ marginTop: 16 }}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  );
}
