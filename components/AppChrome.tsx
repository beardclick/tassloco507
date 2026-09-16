'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CartDrawer } from './CartDrawer';
import { Toast } from './Toast';

export function AppChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && header}
      <main>{children}</main>
      {!isAdmin && footer}
      {!isAdmin && <CartDrawer />}
      {!isAdmin && <Toast />}
    </>
  );
}
