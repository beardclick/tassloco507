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

interface CategoryPageProps {
  params: Promise<{ slug?: string[] }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = slug?.length ? await getCategoryByPath(slug) : undefined;
  if (!cat) return { title: 'Categoría' };
  return { title: cat.name };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

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

  return (
    <>
      <section className="page-head">
        <div className="container">
          <Breadcrumbs items={crumbs} />
          <h1>
            {cat.name} <span>//</span> {products.length}
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

          <ProductGrid products={products} />
        </div>
      </section>
    </>
  );
}
