'use client';

import { useCart } from './CartProvider';

export function Toast() {
  const { toast } = useCart();
  if (!toast) return null;
  return <div className="toast">{toast}</div>;
}
