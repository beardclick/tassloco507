import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { ORDER_STATUSES, updateOrder, updateOrderStatus, type OrderItem, type OrderStatus } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const status = body.status as OrderStatus;
  if (!ORDER_STATUSES.some((s) => s.value === status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }
  const updated = await updateOrderStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, order: updated });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const status = body.status as OrderStatus;
  if (!ORDER_STATUSES.some((s) => s.value === status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  const items: OrderItem[] = (Array.isArray(body.items) ? body.items : []).map((i: OrderItem) => ({
    slug: String(i.slug ?? ''),
    name: String(i.name ?? ''),
    price: Number(i.price ?? 0),
    qty: Math.max(1, Number(i.qty ?? 1)),
    image: i.image ? String(i.image) : null,
  }));
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

  const updated = await updateOrder(id, {
    status,
    customer: {
      nombre: String(body.customer?.nombre ?? ''),
      apellido: String(body.customer?.apellido ?? ''),
      email: String(body.customer?.email ?? ''),
      telefono: String(body.customer?.telefono ?? ''),
    },
    delivery: {
      method: body.delivery?.method === 'recoger' ? 'recoger' : 'envio',
      provincia: String(body.delivery?.provincia ?? ''),
      ciudad: String(body.delivery?.ciudad ?? ''),
      direccion: String(body.delivery?.direccion ?? ''),
      referencia: String(body.delivery?.referencia ?? ''),
    },
    payment: {
      method: body.payment?.method === 'efectivo' ? 'efectivo' : 'transferencia',
    },
    items,
    subtotal,
    total: subtotal,
  });

  if (!updated) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, order: updated });
}
