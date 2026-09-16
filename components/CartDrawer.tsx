'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';
import { formatMoney } from '@/lib/money';
import { CartIcon, CloseIcon, TrashIcon } from './Icons';

export function CartDrawer() {
  const { items, subtotal, isOpen, closeCart, setQty, removeItem } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={closeCart} aria-hidden />
      <aside className="drawer" role="dialog" aria-label="Carrito de compras">
        <div className="drawer__head">
          <h3>Tu Carrito</h3>
          <button className="icon-btn" onClick={closeCart} aria-label="Cerrar">
            <CloseIcon />
          </button>
        </div>

        <div className="drawer__body">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🛒</div>
              <h2>Tu carrito está vacío</h2>
              <p>Agrega piezas y ropa pa&apos; tu ride.</p>
              <button className="btn btn--black" onClick={closeCart}>
                Seguir comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.slug}>
                <div className="cart-item__img">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} loading="lazy" />
                  ) : (
                    <CartIcon style={{ width: 28, margin: 'auto', marginTop: 26, color: '#999' }} />
                  )}
                </div>
                <div>
                  <Link href={item.link} onClick={closeCart} className="cart-item__name">
                    {item.name}
                  </Link>
                  <div className="cart-item__price">{formatMoney(item.price * item.qty)}</div>
                  <div className="qty" style={{ marginTop: 8 }}>
                    <button onClick={() => setQty(item.slug, item.qty - 1)} aria-label="Restar">
                      −
                    </button>
                    <input type="text" value={item.qty} readOnly />
                    <button onClick={() => setQty(item.slug, item.qty + 1)} aria-label="Sumar">
                      +
                    </button>
                  </div>
                </div>
                <div className="cart-item__right">
                  <button className="cart-item__remove" onClick={() => removeItem(item.slug)}>
                    <TrashIcon style={{ width: 16, height: 16 }} /> Quitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer__foot">
            <div className="drawer__subtotal">
              <span>Subtotal</span>
              <span className="amount">{formatMoney(subtotal)}</span>
            </div>
            <Link href="/cart" onClick={closeCart} className="btn btn--ghost" style={{ width: '100%', marginBottom: 10 }}>
              Ver carrito
            </Link>
            <Link href="/checkout" onClick={closeCart} className="btn btn--red">
              Finalizar compra
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
