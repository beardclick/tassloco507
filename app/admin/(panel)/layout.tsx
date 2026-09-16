import type { ReactNode } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE, verifyToken } from '@/lib/auth';
import { LogoutButton } from './LogoutButton';

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!verifyToken(token)) redirect('/admin/login');

  const nav = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/productos', label: 'Productos' },
    { href: '/admin/categorias', label: 'Categorías' },
    { href: '/admin/pedidos', label: 'Pedidos' },
    { href: '/admin/clientes', label: 'Clientes' },
  ];

  return (
    <div className="admin">
      <aside className="admin__side">
        <div className="admin__brand">
          TASS LOCO <span>507</span>
          <small>Panel de administración</small>
        </div>
        <nav className="admin__nav">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
          <Link href="/" target="_blank">
            Ver tienda ↗
          </Link>
        </nav>
        <LogoutButton />
      </aside>
      <div className="admin__main">{children}</div>
    </div>
  );
}
