'use client';

import { useRouter } from 'next/navigation';

export function DeleteAdminButton({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('¿Eliminar este administrador?')) return;
    await fetch(`/api/admin/admins/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <button className="admin-link admin-link--danger" onClick={handleDelete}>
      Eliminar
    </button>
  );
}
