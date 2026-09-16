import { NextResponse } from 'next/server';
import { createOrder, type OrderItem } from '@/lib/db';
import { sendOrderEmails } from '@/lib/email';

interface OrderPayload {
  customer?: { nombre?: string; apellido?: string; email?: string; telefono?: string };
  delivery?: { method?: string; provincia?: string; ciudad?: string; direccion?: string; referencia?: string };
  payment?: { method?: string };
  items?: OrderItem[];
  subtotal?: number;
}

export async function POST(req: Request) {
  let body: OrderPayload = {};
  try {
    body = (await req.json()) as OrderPayload;
  } catch {
    body = {};
  }

  const items: OrderItem[] = Array.isArray(body.items)
    ? body.items.map((i) => ({
        slug: String(i.slug ?? ''),
        name: String(i.name ?? ''),
        price: Number(i.price ?? 0),
        qty: Math.max(1, Number(i.qty ?? 1)),
        image: i.image ? String(i.image) : null,
      }))
    : [];

  if (items.length === 0) {
    return NextResponse.json({ error: 'El pedido está vacío' }, { status: 400 });
  }

  const subtotal = Number(body.subtotal ?? items.reduce((n, i) => n + i.price * i.qty, 0));

  const order = await createOrder({
    status: 'pendiente',
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

  // Enviar correos (confirmación al cliente + aviso al admin) sin bloquear el pedido si falla.
  await sendOrderEmails(order).catch(() => {});

  return NextResponse.json({ ok: true, order });
}
