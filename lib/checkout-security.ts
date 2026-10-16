import type { Product } from './catalog';
import type { OrderItem } from './db';
import { RequestError } from './request-security';

// Solo slug y cantidad proceden del visitante. Precio, nombre e imagen son del catálogo.
export async function priceCheckoutItems(input: unknown, lookup: (slug: string) => Promise<Product | undefined>): Promise<{ items: OrderItem[]; subtotal: number }> {
  if (!Array.isArray(input) || input.length < 1 || input.length > 50) throw new RequestError('El pedido debe contener entre 1 y 50 productos.');
  const quantities = new Map<string, number>();
  for (const item of input) {
    if (!item || typeof item !== 'object' || typeof item.slug !== 'string' || !item.slug || item.slug.length > 200
      || !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 99) {
      throw new RequestError('Producto o cantidad inválidos.');
    }
    const qty = (quantities.get(item.slug) ?? 0) + item.qty;
    if (qty > 99) throw new RequestError('Cantidad máxima por producto: 99.');
    quantities.set(item.slug, qty);
  }
  const items: OrderItem[] = [];
  let cents = 0;
  for (const [slug, qty] of quantities) {
    const product = await lookup(slug);
    if (!product || product.draft || !product.in_stock || product.quoteOnly || product.hidePrice
      || product.categories.some(category => category.slug === 'pedido-especial')) {
      throw new RequestError('Un producto ya no está disponible para compra. Actualiza el carrito.', 409);
    }
    const price = Number(product.prices.price);
    if (product.prices.currency_code !== 'USD' || product.prices.currency_minor_unit !== 2
      || !Number.isSafeInteger(price) || price <= 0) throw new RequestError('Un producto requiere cotización.', 409);
    cents += price * qty;
    if (!Number.isSafeInteger(cents) || cents > 1_000_000_000) throw new RequestError('El total del pedido supera el límite.');
    items.push({ slug: product.slug, name: product.name, price: price / 100, qty, image: product.images[0]?.src ?? null });
  }
  return { items, subtotal: cents / 100 };
}
