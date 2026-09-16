import type { OrderStatus } from '@/lib/db';

const MAP: Record<OrderStatus, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'admin-status--pendiente' },
  confirmado: { label: 'Confirmado', cls: 'admin-status--confirmado' },
  despachado: { label: 'Despachado', cls: 'admin-status--despachado' },
  entregado: { label: 'Entregado', cls: 'admin-status--entregado' },
  cancelado: { label: 'Cancelado', cls: 'admin-status--cancelado' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = MAP[status] ?? MAP.pendiente;
  return <span className={`admin-status ${m.cls}`}>{m.label}</span>;
}
