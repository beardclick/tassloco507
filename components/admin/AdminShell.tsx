'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { CloseIcon, MenuIcon } from '@/components/Icons';
import { LogoutButton } from '@/app/admin/(panel)/LogoutButton';

const nav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/homepage', label: 'Homepage' },
  { href: '/admin/productos', label: 'Productos' },
  { href: '/admin/categorias', label: 'Categorías' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/clientes', label: 'Clientes' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="admin">
      <div className="admin-mobile-bar">
        <div className="admin__brand">TASS LOCO <span>507</span></div>
        <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Abrir menú del admin">
          <MenuIcon />
        </button>
      </div>
      {open && <button className="admin-menu-backdrop" onClick={() => setOpen(false)} aria-label="Cerrar menú" />}
      <aside className={`admin__side ${open ? 'admin__side--open' : ''}`}>
        <div className="admin__side-head">
          <div className="admin__brand">
            TASS LOCO <span>507</span>
            <small>Panel de administración</small>
          </div>
          <button className="icon-btn admin-menu-close" onClick={() => setOpen(false)} aria-label="Cerrar menú del admin">
            <CloseIcon />
          </button>
        </div>
        <nav className="admin__nav">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? 'admin__nav--active' : ''}>
              {item.label}
            </Link>
          ))}
          <Link href="/" target="_blank">Ver tienda ↗</Link>
        </nav>
        <LogoutButton />
      </aside>
      <main className="admin__main">{children}</main>
    </div>
  );
}
