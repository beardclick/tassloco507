'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useCart } from './CartProvider';
import { SearchBar } from './SearchBar';
import { SITE } from '@/lib/site';
import {
  CartIcon,
  CloseIcon,
  InstagramIcon,
  MenuIcon,
  SearchIcon,
  WhatsappIcon,
  YoutubeIcon,
} from './Icons';

export interface NavItem {
  name: string;
  href: string;
  children?: NavItem[];
}

export function Header({ nav }: { nav: NavItem[] }) {
  const { count, openCart } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const links: NavItem[] = [
    { name: 'Inicio', href: '/' },
    { name: 'Tienda', href: '/shop' },
    ...nav,
    { name: 'Contacto', href: '/contacto' },
  ];

  return (
    <>
      <div className="topbar">
        <div className="topbar__inner">
          <span className="dot">●</span> ENVÍOS A TODO PANAMÁ
          <span className="dot">●</span> FASHION · CAR · RACING
          <a
            href={SITE.whatsappLink}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#fff', textDecoration: 'underline' }}
          >
            <WhatsappIcon style={{ width: 14, height: 14 }} /> {SITE.whatsapp}
          </a>
        </div>
      </div>

      <header className="header">
        <div className="container header__inner">
          <Link href="/" className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SITE.logo} alt="Tass Loco 507" className="logo__img" />
            <span className="logo__text">
              <span className="logo__name">
                Tass Loco <span>507</span>
              </span>
              <span className="logo__sub">Fashion · Car · Racing</span>
            </span>
          </Link>

          <nav className="nav">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav__link ${isActive(item.href) ? 'nav__link--active' : ''}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="header__actions">
            <button
              className="icon-btn"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar"
            >
              <SearchIcon />
            </button>
            <button className="icon-btn" onClick={openCart} aria-label="Abrir carrito">
              <CartIcon />
              {count > 0 && <span className="cart-count">{count}</span>}
            </button>
            <button
              className="icon-btn menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="container" style={{ paddingBottom: 14 }}>
            <SearchBar onDone={() => setSearchOpen(false)} />
          </div>
        )}
      </header>

      {menuOpen && (
        <>
          <div className="menu-backdrop" onClick={() => setMenuOpen(false)} aria-hidden />
          <aside className="menu-drawer" role="dialog" aria-label="Menú">
            <div className="menu-drawer__head">
              <Link href="/" className="logo" onClick={() => setMenuOpen(false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={SITE.logo} alt="Tass Loco 507" className="logo__img" />
                <span className="logo__text">
                  <span className="logo__name">
                    Tass Loco <span>507</span>
                  </span>
                  <span className="logo__sub">Fashion · Car · Racing</span>
                </span>
              </Link>
              <button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
                <CloseIcon />
              </button>
            </div>

            <nav className="menu-drawer__nav">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`menu-link ${isActive(item.href) ? 'menu-link--active' : ''}`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="menu-drawer__foot">
              <a
                href={SITE.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn--red btn--block"
              >
                <WhatsappIcon style={{ width: 18, height: 18 }} /> Escríbenos
              </a>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a href={SITE.instagram} target="_blank" rel="noreferrer" className="icon-btn" aria-label="Instagram">
                  <InstagramIcon />
                </a>
                <a href={SITE.youtube} target="_blank" rel="noreferrer" className="icon-btn" aria-label="YouTube">
                  <YoutubeIcon />
                </a>
                <a href={SITE.whatsappLink} target="_blank" rel="noreferrer" className="icon-btn" aria-label="WhatsApp">
                  <WhatsappIcon />
                </a>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
