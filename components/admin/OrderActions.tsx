'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/order';

export function OrderActions({ orderId, current }: { orderId: string; current: OrderStatus }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function changeStatus(status: OrderStatus) {
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    router.refresh();
    setSaving(false);
  }

  return (
    <div className="admin-card">
      <h2 className="admin-card__title">Cambiar estado</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s.value}
            className={`btn btn--sm ${s.value === current ? 'btn--black' : 'btn--ghost'}`}
            disabled={saving || s.value === current}
            onClick={() => changeStatus(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
