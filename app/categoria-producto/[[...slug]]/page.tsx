import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  categorySlugPath,
  getCategoryByPath,
  getCategoryChildren,
  getCategoryProductCount,
  getProductsForCategory,
} from '@/lib/catalog';
import { ProductGrid } from '@/components/ProductGrid';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Pagination } from '@/components/Pagination';

const PER_PAGE = 12;

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = slug?.length ? await getCategoryByPath(slug) : undefined;
  if (!cat) return { title: 'Categoría' };
  return { title: cat.name };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;

  if (!slug || slug.length === 0) {
    redirect('/shop');
  }

  const cat = await getCategoryByPath(slug);
  if (!cat) notFound();

  const products = await getProductsForCategory(cat);
  const children = await getCategoryChildren(cat);
  const path = await categorySlugPath(cat);

  const crumbs = [];
  for (let i = 0; i < path.length; i++) {
    const prefix = path.slice(0, i + 1);
    const pc = await getCategoryByPath(prefix);
    crumbs.push({
      label: pc?.name ?? prefix[prefix.length - 1],
      href: '/categoria-producto/' + prefix.join('/'),
    });
  }

  const childCounts = new Map<number, number>();
  for (const c of children) childCounts.set(c.id, await getCategoryProductCount(c));

  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentPage = Math.min(totalPages, Math.max(1, Number(pageParam) || 1));
  const pageProducts = products.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const basePath = '/categoria-producto/' + path.join('/');
  function hrefForPage(p: number) {
    return p > 1 ? `${basePath}?page=${p}` : basePath;
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <Breadcrumbs items={crumbs} />
          <h1>
            {cat.name} <span>//</span> {total}
          </h1>
          {cat.description ? <p>{cat.description}</p> : null}
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          {children.length > 0 && (
            <div className="chips" style={{ marginBottom: 24 }}>
              {children.map((c) => (
                <Link key={c.id} href={`/categoria-producto/${path.join('/')}/${c.slug}`} className="chip">
                  {c.name} ({childCounts.get(c.id) ?? 0})
                </Link>
              ))}
            </div>
          )}

          <ProductGrid products={pageProducts} />

          <Pagination page={currentPage} totalPages={totalPages} hrefForPage={hrefForPage} />
        </div>
      </section>
    </>
  );
}
