import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getProductBySlug,
  getRelatedProducts,
  toSummary,
} from '@/lib/catalog';
import { formatMoney } from '@/lib/money';
import { SITE } from '@/lib/site';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ProductGallery } from '@/components/ProductGallery';
import { BuyBox } from '@/components/BuyBox';
import { ProductGrid } from '@/components/ProductGrid';
import { CheckIcon, TruckIcon, WhatsappIcon } from '@/components/Icons';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Producto no encontrado' };
  return { title: product.name, description: product.short_description };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const summary = toSummary(product);
  const related = await getRelatedProducts(product, 4);
  const firstCat = product.categories[0];
  const firstCatHref = firstCat
    ? firstCat.link.replace('https://tassloco507.com', '')
    : '/shop';
  const waText = encodeURIComponent(`Hola Tass Loco 507, me interesa: ${product.name} (${formatMoney(summary.price)})`);

  return (
    <>
      <div className="container">
        <Breadcrumbs
          items={[
            ...(firstCat ? [{ label: firstCat.name, href: firstCatHref }] : []),
            { label: product.name },
          ]}
        />
      </div>

      <section className="section section--tight">
        <div className="container pdp">
          <div className="pdp__gallery">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          <div>
            <div className="pdp__cats">
              {product.categories.map((c) => (
                <Link
                  key={c.id}
                  href={c.link.replace('https://tassloco507.com', '')}
                  className="tag"
                >
                  {c.name}
                </Link>
              ))}
              {product.on_sale && <span className="badge badge--red">Oferta</span>}
            </div>

            <h1 className="pdp__title">{product.name}</h1>

            <div className="pdp__price">
              <span className="now">{formatMoney(summary.price)}</span>
              {summary.onSale && summary.regularPrice && (
                <span className="old">{formatMoney(summary.regularPrice)}</span>
              )}
            </div>

            <p className="pdp__status">
              {product.in_stock ? (
                <span style={{ color: '#1a7f37', fontWeight: 700 }}>● En stock</span>
              ) : (
                <span style={{ color: 'var(--red)', fontWeight: 700 }}>● Agotado — consulta disponibilidad</span>
              )}
            </p>

            {product.short_description && <p className="pdp__desc">{product.short_description}</p>}

            <BuyBox product={summary} />

            <a
              href={`${SITE.whatsappLink}?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn--black btn--lg"
              style={{ marginBottom: 24 }}
            >
              <WhatsappIcon style={{ width: 18, height: 18 }} /> Pedir por WhatsApp
            </a>

            <div className="pdp__meta">
              <h4>Detalles</h4>
              <ul>
                {product.sku && (
                  <li><b>SKU:</b> {product.sku}</li>
                )}
                <li>
                  <b>Categorías:</b>{' '}
                  {product.categories.map((c) => c.name).join(', ')}
                </li>
                <li>
                  <b>Envío:</b> Todo Panamá
                </li>
                <li>
                  <b>Pago:</b> Transferencia bancaria o efectivo
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {product.description && (
        <section className="section section--tight">
          <div className="container">
            <div className="prose pdp__desc" dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section related">
          <div className="container">
            <span className="tag tag--red">También te puede gustar</span>
            <h2 className="section-title" style={{ marginTop: 12, marginBottom: 28 }}>Relacionados</h2>
            <ProductGrid products={related} />
          </div>
        </section>
      )}

      <section className="section section--tight">
        <div className="container" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div className="feature">
            <div className="feature__icon"><TruckIcon /></div>
            <div>
              <p className="feature__title">Envíos a todo Panamá</p>
              <p className="feature__text">Coordinamos tu entrega.</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature__icon"><CheckIcon /></div>
            <div>
              <p className="feature__title">Piezas seleccionadas</p>
              <p className="feature__text">Calidad para tu ride.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
