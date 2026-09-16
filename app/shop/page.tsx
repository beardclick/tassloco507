import { Suspense } from 'react';
import Link from 'next/link';
import {
  categorySubtreeIds,
  categoryTree,
  getCategoryBySlug,
  loadProducts,
  moneyValue,
  searchProducts,
} from '@/lib/catalog';
import { ProductGrid } from '@/components/ProductGrid';
import { SearchBar } from '@/components/SearchBar';
import { SortSelect } from '@/components/SortSelect';
import { Pagination } from '@/components/Pagination';
import { MobileFilters } from '@/components/MobileFilters';

export const metadata = { title: 'Tienda' };
export const dynamic = 'force-dynamic';

const PER_PAGE = 24;

interface ShopParams {
  q?: string;
  cat?: string;
  sort?: string;
  page?: string;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopParams>;
}) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const catSlug = (params.cat ?? '').trim();
  const sort = params.sort ?? 'newest';

  let products = q ? await searchProducts(q) : await loadProducts();

  const activeCat = catSlug ? ((await getCategoryBySlug(catSlug)) ?? null) : null;
  if (activeCat) {
    const ids = new Set(await categorySubtreeIds(activeCat));
    products = products.filter((p) => p.categories.some((c) => ids.has(c.id)));
  }

  if (sort === 'price-asc') {
    products = [...products].sort((a, b) => moneyValue(a.prices) - moneyValue(b.prices));
  } else if (sort === 'price-desc') {
    products = [...products].sort((a, b) => moneyValue(b.prices) - moneyValue(a.prices));
  } else if (sort === 'name') {
    products = [...products].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  } else {
    products = [...products].sort((a, b) => b.id - a.id);
  }

  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentPage = Math.min(totalPages, Math.max(1, Number(params.page) || 1));
  const pageProducts = products.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const roots = await categoryTree();

  function hrefForPage(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (catSlug) sp.set('cat', catSlug);
    if (sort && sort !== 'newest') sp.set('sort', sort);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return qs ? `/shop?${qs}` : '/shop';
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>
            Tienda <span>//</span> Todo
          </h1>
          <p>
            {total} producto{total === 1 ? '' : 's'}
            {activeCat ? ` en «${activeCat.name}»` : ''}
            {q ? ` para «${q}»` : ''}
          </p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="shop-toolbar shop-toolbar--desktop">
            <SearchBar initialValue={q} placeholder="Buscar en la tienda…" />
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          <div className="chips chips--desktop">
            <Link href="/shop" className={`chip ${!activeCat && !q ? 'chip--active' : ''}`}>
              Todos
            </Link>
            {roots.map((c) => (
              <Link
                key={c.id}
                href={`/shop?cat=${c.slug}`}
                className={`chip ${activeCat?.slug === c.slug ? 'chip--active' : ''}`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          <MobileFilters
            categories={roots.map((c) => ({ slug: c.slug, name: c.name }))}
            activeCat={activeCat?.slug ?? null}
            q={q}
          />

          <ProductGrid products={pageProducts} />

          <Pagination page={currentPage} totalPages={totalPages} hrefForPage={hrefForPage} />
        </div>
      </section>
    </>
  );
}
