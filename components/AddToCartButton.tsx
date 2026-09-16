'use client';

import { useCart } from './CartProvider';
import type { ProductSummary } from '@/lib/client-types';
import { CartIcon } from './Icons';

export function AddToCartButton({
  product,
  className = 'btn btn--black',
  label,
}: {
  product: ProductSummary;
  className?: string;
  label?: string;
}) {
  const { addItem } = useCart();
  const disabled = !product.inStock;

  return (
    <button
      className={className}
      disabled={disabled}
      onClick={() => addItem(product, 1)}
      aria-label={`Agregar ${product.name} al carrito`}
    >
      <CartIcon style={{ width: 18, height: 18 }} />
      {disabled ? 'Agotado' : label ?? 'Agregar'}
    </button>
  );
}
