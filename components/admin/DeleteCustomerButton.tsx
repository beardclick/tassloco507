'use client';

import { useRouter } from 'next/navigation';

export function DeleteCustomerButton({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('¿Eliminar este cliente? Sus pedidos se conservarán.')) return;
    await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <button className="admin-link admin-link--danger" onClick={handleDelete}>
      Eliminar
    </button>
  );
}
