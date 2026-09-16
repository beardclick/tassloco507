import Link from 'next/link';
import { getOrders, getProducts } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const products = await getProducts();
  const orders = await getOrders();
  const pending = orders.filter((o) => o.status === 'pendiente').length;
  const revenue = orders
    .filter((o) => o.status !== 'cancelado')
    .reduce((n, o) => n + o.total, 0);

  return (
    <div>
      <h1 className="admin-title">Dashboard</h1>

      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat__value">{products.length}</span>
          <span className="admin-stat__label">Productos</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__value">{orders.length}</span>
          <span className="admin-stat__label">Pedidos</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__value">{pending}</span>
          <span className="admin-stat__label">Pendientes</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__value">{formatMoney(revenue)}</span>
          <span className="admin-stat__label">Ingresos</span>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__head">
          <h2 className="admin-card__title">Últimos pedidos</h2>
          <Link href="/admin/pedidos" className="admin-link">
            Ver todos
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="admin-empty">Aún no hay pedidos. Comparte el enlace de la tienda para empezar a recibir.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/pedidos/${o.id}`} className="admin-link">
                      {o.number}
                    </Link>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleString('es-PA')}</td>
                  <td>{o.customer.nombre}</td>
                  <td>{formatMoney(o.total)}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <Link href="/admin/productos/nuevo" className="btn btn--red">
          + Nuevo producto
        </Link>
        <Link href="/admin/productos" className="btn btn--black">
          Gestionar productos
        </Link>
        <Link href="/admin/pedidos" className="btn btn--ghost">
          Ver pedidos
        </Link>
      </div>
    </div>
  );
}
