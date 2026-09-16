'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SortSelect } from './SortSelect';
import { CloseIcon } from './Icons';

export function MobileFilters({
  categories,
  activeCat,
  q,
}: {
  categories: { slug: string; name: string }[];
  activeCat: string | null;
  q: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mobile-filter">
        <button className="btn btn--black btn--block" onClick={() => setOpen(true)}>
          ⚙ Filtrar & ordenar
        </button>
      </div>

      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} aria-hidden />
          <aside className="filter-drawer" role="dialog" aria-label="Filtros">
            <div className="filter-drawer__head">
              <h3>Filtros</h3>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar filtros">
                <CloseIcon />
              </button>
            </div>
            <div className="filter-drawer__body">
              <div>
                <h4>Categorías</h4>
                <div className="filter-drawer__list">
                  <Link
                    href="/shop"
                    onClick={() => setOpen(false)}
                    className={!activeCat && !q ? 'filter-link--active' : ''}
                  >
                    Todos
                  </Link>
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/shop?cat=${c.slug}`}
                      onClick={() => setOpen(false)}
                      className={activeCat === c.slug ? 'filter-link--active' : ''}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h4>Ordenar</h4>
                <SortSelect />
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
