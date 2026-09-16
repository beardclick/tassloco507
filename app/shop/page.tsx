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

export const metadata = { title: 'Tienda' };
export const dynamic = 'force-dynamic';

interface ShopParams {
  q?: string;
  cat?: string;
  sort?: string;
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

  const roots = await categoryTree();

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>
            Tienda <span>//</span> Todo
          </h1>
          <p>
            {products.length} producto{products.length === 1 ? '' : 's'}
            {activeCat ? ` en «${activeCat.name}»` : ''}
            {q ? ` para «${q}»` : ''}
          </p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="shop-toolbar">
            <SearchBar initialValue={q} placeholder="Buscar en la tienda…" />
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          <div className="chips">
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

          <ProductGrid products={products} />
        </div>
      </section>
    </>
  );
}
