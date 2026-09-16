// Pure order types/constants — safe for client and server (no Node imports).

export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'despachado'
  | 'entregado'
  | 'cancelado';

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'despachado', label: 'Despachado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];
