import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { toSummary, type Product } from '@/lib/catalog';
import { AddToCartButton } from './AddToCartButton';
import { SITE } from '@/lib/site';
import { WhatsappIcon } from './Icons';

export function ProductCard({ product }: { product: Product }) {
  const summary = toSummary(product);
  const category = product.categories[0]?.name ?? '';
  const waHref = `${SITE.whatsappLink}?text=${encodeURIComponent(`Hola Tass Loco 507, me interesa: ${product.name}`)}`;

  return (
    <article className="product-card">
      <Link href={`/producto/${product.slug}`} className="product-card__media" aria-label={product.name}>
        {summary.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={summary.image} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-card__media--empty">TASS LOCO</div>
        )}
        <div className="product-card__badges">
          {product.on_sale && <span className="badge badge--red">Oferta</span>}
          {!product.in_stock && <span className="badge badge--gray">Agotado</span>}
        </div>
      </Link>
      <div className="product-card__body">
        {category && <p className="product-card__cats">{category}</p>}
        <Link href={`/producto/${product.slug}`} className="product-card__name">
          {product.name}
        </Link>
        {!summary.hidePrice && (
          <div className="product-card__price-row">
            <span className="product-card__price">{formatMoney(summary.price)}</span>
            {summary.onSale && summary.regularPrice && (
              <span className="product-card__price--old">{formatMoney(summary.regularPrice)}</span>
            )}
          </div>
        )}
        <div className="product-card__actions">
          {summary.quoteOnly ? (
            <a href={waHref} target="_blank" rel="noreferrer" className="btn btn--black btn--sm">
              <WhatsappIcon style={{ width: 16, height: 16 }} /> Consultar
            </a>
          ) : (
            <AddToCartButton product={summary} className="btn btn--black btn--sm" />
          )}
          <Link href={`/producto/${product.slug}`} className="btn btn--ghost btn--sm" aria-label="Ver detalle">
            Ver
          </Link>
        </div>
      </div>
    </article>
  );
}
