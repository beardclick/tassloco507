'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// El enlace de recuperación de Supabase redirige a la raíz con el token en el hash.
// Este componente detecta "type=recovery" y lleva a /reset-password preservando el hash.
export function RecoveryRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      router.replace(`/reset-password${hash}`);
    }
  }, [router]);

  return null;
}
