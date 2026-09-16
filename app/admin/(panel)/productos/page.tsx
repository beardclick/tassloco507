import Link from 'next/link';
import { getProducts } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { DeleteProductButton } from '@/components/admin/DeleteProductButton';

export const dynamic = 'force-dynamic';

export default async function AdminProductos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').toLowerCase().trim();
  let products = getProducts();
  if (query) {
    products = products.filter((p) =>
      `${p.name} ${p.sku}`.toLowerCase().includes(query),
    );
  }

  return (
    <div>
      <div className="admin-card__head" style={{ marginBottom: 16 }}>
        <h1 className="admin-title" style={{ margin: 0 }}>
          Productos
        </h1>
        <Link href="/admin/productos/nuevo" className="btn btn--red">
          + Nuevo producto
        </Link>
      </div>

      <form style={{ display: 'flex', gap: 8, marginBottom: 16, maxWidth: 420 }}>
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Buscar producto o SKU…"
          aria-label="Buscar producto"
          style={{ flex: 1, padding: '11px 14px', border: '2px solid var(--black)', borderRadius: 10 }}
        />
        <button className="btn btn--black" type="submit">
          Buscar
        </button>
      </form>

      <div className="admin-card">
        {products.length === 0 ? (
          <p className="admin-empty">No hay productos que coincidan.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Categorías</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="admin-product">
                      {p.images[0]?.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].thumbnail} alt="" className="admin-product__img" />
                      ) : (
                        <div className="admin-product__img admin-product__img--empty">TL</div>
                      )}
                      <div>
                        <Link href={`/admin/productos/${p.id}`} className="admin-link">
                          {p.name}
                        </Link>
                        {p.sku && <div className="admin-muted">SKU: {p.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {formatMoney(Number(p.prices.price) / 100)}
                    {p.on_sale && <span className="admin-tag">Oferta</span>}
                  </td>
                  <td>
                    {p.in_stock ? (
                      <span className="admin-status admin-status--entregado">En stock</span>
                    ) : (
                      <span className="admin-status admin-status--cancelado">Agotado</span>
                    )}
                  </td>
                  <td className="admin-muted">
                    {p.categories.map((c) => c.name).join(', ') || '—'}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link href={`/admin/productos/${p.id}`} className="admin-link">
                      Editar
                    </Link>{' '}
                    <DeleteProductButton id={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="admin-muted" style={{ marginTop: 12 }}>
          {products.length} producto{products.length === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  );
}
