import Link from 'next/link';
import { getOrders } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function AdminPedidos() {
  const orders = await getOrders();

  return (
    <div>
      <h1 className="admin-title">Pedidos</h1>
      <div className="admin-card">
        {orders.length === 0 ? (
          <p className="admin-empty">
            Aún no hay pedidos. Cuando un cliente finalice la compra, aparecerán aquí.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Pago</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/pedidos/${o.id}`} className="admin-link">
                      {o.number}
                    </Link>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleString('es-PA')}</td>
                  <td>{o.customer.nombre}</td>
                  <td className="admin-muted">{o.customer.telefono}</td>
                  <td className="admin-muted">
                    {o.payment.method === 'transferencia' ? 'Transferencia' : 'Efectivo'}
                  </td>
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
    </div>
  );
}
