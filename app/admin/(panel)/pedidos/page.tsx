import Link from 'next/link';
import { getOrders } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { formatDateTime } from '@/lib/dates';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { EyeIcon } from '@/components/Icons';
import { DeleteOrderButton } from '@/components/admin/DeleteOrderButton';

export const dynamic = 'force-dynamic';

const PER_PAGE = 10;

export default async function AdminPedidos({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const orders = await getOrders();

  const total = orders.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentPage = Math.min(totalPages, Math.max(1, Number(page) || 1));
  const pageOrders = orders.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function hrefForPage(p: number) {
    return p > 1 ? `/admin/pedidos?page=${p}` : '/admin/pedidos';
  }

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
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageOrders.map((o) => (
                <tr key={o.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <Link href={`/admin/pedidos/${o.id}`} className="admin-link">
                      {o.number}
                    </Link>{' '}
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="admin-link"
                      aria-label="Ver pedido"
                      title="Ver pedido"
                      style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
                    >
                      <EyeIcon style={{ width: 16, height: 16 }} />
                    </Link>
                  </td>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td>{o.customer.nombre}</td>
                  <td className="admin-muted">{o.customer.telefono}</td>
                  <td className="admin-muted">
                    {o.payment.method === 'transferencia' ? 'Transferencia' : 'Efectivo'}
                  </td>
                  <td>{formatMoney(o.total)}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <DeleteOrderButton id={o.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > 0 && (
          <p className="admin-muted" style={{ marginTop: 12 }}>
            {total} pedido{total === 1 ? '' : 's'}
            {totalPages > 1 ? ` · página ${currentPage} de ${totalPages}` : ''}
          </p>
        )}
        <Pagination page={currentPage} totalPages={totalPages} hrefForPage={hrefForPage} />
      </div>
    </div>
  );
}
