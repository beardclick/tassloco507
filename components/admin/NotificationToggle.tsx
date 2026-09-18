'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NotificationToggle({ email, enabled }: { email: string; enabled: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);

  async function toggle() {
    const next = !checked;
    setChecked(next);
    try {
      await fetch('/api/admin/admin-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, disabled: !next }),
      });
    } finally {
      router.refresh();
    }
  }

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.82rem' }}>
      <input type="checkbox" checked={checked} onChange={toggle} style={{ accentColor: 'var(--red)' }} />
      Recibir notificaciones
    </label>
  );
}
