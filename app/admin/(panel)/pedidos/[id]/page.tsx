import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderById } from '@/lib/db';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { OrderEditForm } from '@/components/admin/OrderEditForm';

export const dynamic = 'force-dynamic';

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div>
      <div className="admin-card__head" style={{ marginBottom: 16 }}>
        <div>
          <Link href="/admin/pedidos" className="admin-link">
            ← Pedidos
          </Link>
          <h1 className="admin-title" style={{ margin: '6px 0 0' }}>
            Pedido {order.number}
          </h1>
          <p className="admin-muted" style={{ margin: '2px 0 0' }}>
            {new Date(order.createdAt).toLocaleString('es-PA')} ·{' '}
            {order.payment.method === 'transferencia' ? 'Transferencia' : 'Efectivo'}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <OrderEditForm order={order} />
    </div>
  );
}
