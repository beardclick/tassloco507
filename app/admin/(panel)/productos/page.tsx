import Link from 'next/link';
import { getProducts } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { DeleteProductButton } from '@/components/admin/DeleteProductButton';
import { flattenCategories } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminProductos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; status?: string }>;
}) {
  const { q, category, sort = 'date-desc', status = 'all' } = await searchParams;
  const query = (q ?? '').toLowerCase().trim();
  const categories = await flattenCategories();
  let products = await getProducts(true);
  if (query) {
    products = products.filter((p) =>
      `${p.name} ${p.sku}`.toLowerCase().includes(query),
    );
  }
  if (category) {
    const categoryId = Number(category);
    products = products.filter((product) =>
      product.categories.some((productCategory) => productCategory.id === categoryId),
    );
  }
  if (status === 'published') products = products.filter((product) => !product.draft);
  if (status === 'draft') products = products.filter((product) => product.draft);

  products.sort((a, b) => {
    if (sort === 'az') return a.name.localeCompare(b.name, 'es');
    if (sort === 'za') return b.name.localeCompare(a.name, 'es');
    const aDate = a.createdAt ? Date.parse(a.createdAt) : a.id;
    const bDate = b.createdAt ? Date.parse(b.createdAt) : b.id;
    return sort === 'date-asc' ? aDate - bDate : bDate - aDate;
  });

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

      <form className="admin-product-filters">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Buscar producto o SKU…"
          aria-label="Buscar producto"
          className="admin-filter-input"
        />
        <select name="category" defaultValue={category ?? ''} aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {'— '.repeat(item.depth)}{item.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status} aria-label="Filtrar por estado">
          <option value="all">Todos los estados</option>
          <option value="published">Publicados</option>
          <option value="draft">Borradores</option>
        </select>
        <select name="sort" defaultValue={sort} aria-label="Ordenar productos">
          <option value="date-desc">Más recientes</option>
          <option value="date-asc">Más antiguos</option>
          <option value="az">Nombre A–Z</option>
          <option value="za">Nombre Z–A</option>
        </select>
        <button className="btn btn--black" type="submit">
          Aplicar
        </button>
        <Link href="/admin/productos" className="btn btn--ghost">Limpiar</Link>
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
                        {p.draft && <span className="admin-status admin-status--draft">Borrador</span>}
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
          {products.length} producto{products.length === 1 ? '' : 's'} mostrado{products.length === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  );
}
