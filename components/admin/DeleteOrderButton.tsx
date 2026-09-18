'use client';

import { useRouter } from 'next/navigation';

export function DeleteOrderButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) return;
    await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <button className="admin-link admin-link--danger" onClick={handleDelete}>
      Eliminar
    </button>
  );
}
