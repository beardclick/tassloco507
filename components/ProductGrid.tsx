import type { Product } from '@/lib/catalog';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔎</div>
        <h2>No encontramos nada</h2>
        <p>Prueba con otra búsqueda o categoría.</p>
      </div>
    );
  }
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
