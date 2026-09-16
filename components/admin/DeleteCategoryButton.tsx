'use client';

import { useRouter } from 'next/navigation';

export function DeleteCategoryButton({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('¿Eliminar esta categoría? Los productos se mantendrán, solo se les quitará esta categoría.')) {
      return;
    }
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <button className="admin-link admin-link--danger" onClick={handleDelete}>
      Eliminar
    </button>
  );
}
