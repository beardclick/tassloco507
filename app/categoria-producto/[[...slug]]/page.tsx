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
  const cat = slug?.length ? getCategoryByPath(slug) : undefined;
  if (!cat) return { title: 'Categoría' };
  return { title: cat.name };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    redirect('/shop');
  }

  const cat = getCategoryByPath(slug);
  if (!cat) notFound();

  const products = getProductsForCategory(cat);
  const children = getCategoryChildren(cat);
  const path = categorySlugPath(cat);

  const crumbs = path.map((seg, i) => ({
    label: getCategoryByPath(path.slice(0, i + 1))?.name ?? seg,
    href: '/categoria-producto/' + path.slice(0, i + 1).join('/'),
  }));

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
                  {c.name} ({getCategoryProductCount(c)})
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
