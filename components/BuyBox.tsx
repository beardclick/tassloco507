'use client';

import { useState } from 'react';
import { useCart } from './CartProvider';
import { QtyStepper } from './QtyStepper';
import type { ProductSummary } from '@/lib/client-types';
import { CartIcon } from './Icons';

export function BuyBox({ product }: { product: ProductSummary }) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  return (
    <div className="pdp__buy">
      <QtyStepper value={qty} onChange={setQty} />
      <button
        className="btn btn--red btn--lg"
        disabled={!product.inStock}
        onClick={() => addItem(product, qty)}
      >
        <CartIcon style={{ width: 18, height: 18 }} />
        {product.inStock ? 'Agregar al carrito' : 'Agotado'}
      </button>
    </div>
  );
}
