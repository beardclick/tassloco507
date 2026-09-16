'use client';

import { useRouter } from 'next/navigation';

export function DeleteProductButton({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <button className="admin-link admin-link--danger" onClick={handleDelete}>
      Eliminar
    </button>
  );
}
