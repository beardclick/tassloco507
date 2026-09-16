'use client';

import { useRouter } from 'next/navigation';

export function CustomerLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
      Cerrar sesión
    </button>
  );
}
