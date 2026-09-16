'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { QtyStepper } from '@/components/QtyStepper';
import { formatMoney } from '@/lib/money';
import { ArrowRightIcon, TrashIcon } from '@/components/Icons';

export default function CartPage() {
  const { items, subtotal, setQty, removeItem } = useCart();

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>
            Carrito <span>//</span> {items.reduce((n, i) => n + i.qty, 0)}
          </h1>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🛒</div>
              <h2>Tu carrito está vacío</h2>
              <p>Échale un vistazo a la tienda y arma tu ride.</p>
              <Link href="/shop" className="btn btn--red btn--lg" style={{ marginTop: 8 }}>
                Ir a la tienda
              </Link>
            </div>
          ) : (
            <div className="cart-page">
              <div className="cart-list">
                {items.map((item) => (
                  <div className="cart-item" key={item.slug}>
                    <Link href={item.link} className="cart-item__img">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.name} loading="lazy" />
                      ) : (
                        <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#999' }}>TL</div>
                      )}
                    </Link>
                    <div>
                      <Link href={item.link} className="cart-item__name">
                        {item.name}
                      </Link>
                      <div className="cart-item__meta">
                        {formatMoney(item.price)} c/u
                        {item.onSale && item.regularPrice ? ` · antes ${formatMoney(item.regularPrice)}` : ''}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <QtyStepper value={item.qty} onChange={(v) => setQty(item.slug, v)} />
                      </div>
                    </div>
                    <div className="cart-item__right">
                      <span className="cart-item__price">{formatMoney(item.price * item.qty)}</span>
                      <button className="cart-item__remove" onClick={() => removeItem(item.slug)}>
                        <TrashIcon style={{ width: 16, height: 16 }} /> Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary">
                <h2>Resumen</h2>
                <div className="summary__row">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="summary__row">
                  <span>Envío</span>
                  <span style={{ color: 'var(--gray-500)' }}>A coordinar</span>
                </div>
                <div className="summary__row summary__row--total">
                  <span>Total</span>
                  <span className="amount">{formatMoney(subtotal)}</span>
                </div>
                <Link href="/checkout" className="btn btn--red btn--block btn--lg" style={{ marginTop: 12 }}>
                  Finalizar compra <ArrowRightIcon style={{ width: 18, height: 18 }} />
                </Link>
                <Link href="/shop" className="btn btn--ghost btn--block" style={{ marginTop: 10 }}>
                  Seguir comprando
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
