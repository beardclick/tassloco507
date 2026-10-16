'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NotificationToggle({ email, enabled }: { email: string; enabled: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const [saved, setSaved] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function save() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/admin-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, disabled: !checked }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo guardar. Inténtalo de nuevo.');
      setSaved(checked);
      setMessage('Guardado');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.82rem' }}>
        <input type="checkbox" checked={checked} disabled={saving} onChange={(event) => {
          setChecked(event.target.checked);
          setError('');
          setMessage('');
        }} style={{ accentColor: 'var(--red)' }} />
        Recibir notificaciones
      </label>
      <button type="button" className="btn btn--red btn--sm" disabled={saving || checked === saved} onClick={save}
        aria-label={`Guardar notificaciones de ${email}`}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
      {error && <span role="alert" className="admin-login__error">{error}</span>}
      <span role="status" aria-live="polite" style={{ fontSize: '0.82rem' }}>
        {message || (checked !== saved ? 'Cambios sin guardar' : '')}
      </span>
    </div>
  );
}
