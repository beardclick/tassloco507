import { NextResponse } from 'next/server';
import { createCustomer, createOrder, getCustomerByEmail, getOrders, type OrderItem } from '@/lib/db';
import { sendOrderEmails } from '@/lib/email';
import { CUSTOMER_COOKIE, currentCustomer, signCustomerToken } from '@/lib/customer-auth';
import { hashPassword } from '@/lib/password';

interface OrderPayload {
  customer?: { nombre?: string; apellido?: string; email?: string; telefono?: string };
  delivery?: { method?: string; provincia?: string; ciudad?: string; direccion?: string; referencia?: string };
  payment?: { method?: string };
  items?: OrderItem[];
  subtotal?: number;
  createAccount?: boolean;
  password?: string;
  website?: string;
}

export async function POST(req: Request) {
  let body: OrderPayload = {};
  try {
    body = (await req.json()) as OrderPayload;
  } catch {
    body = {};
  }

  const nombre = String(body.customer?.nombre ?? '');
  const apellido = String(body.customer?.apellido ?? '');
  const email = String(body.customer?.email ?? '').trim().toLowerCase();
  const telefono = String(body.customer?.telefono ?? '');

  // Honeypot anti-spam
  if (String(body.website ?? '').trim()) {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
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

  const createAccount = Boolean(body.createAccount);
  const password = String(body.password ?? '');

  // Si el correo ya está registrado y el usuario no ha iniciado sesión como tal, obligar a login.
  const existing = email ? await getCustomerByEmail(email) : undefined;
  const session = await currentCustomer();
  const isAuth = session ? session.email.toLowerCase() === email : false;
  if (existing && !isAuth) {
    return NextResponse.json(
      { ok: false, code: 'LOGIN_REQUIRED', error: 'Este correo ya está registrado. Inicia sesión para continuar.' },
      { status: 409 },
    );
  }

  // Si el correo ya tiene pedidos anteriores (como invitado) y no inició sesión → crear cuenta.
  if (!isAuth && email) {
    const hasPriorOrders = (await getOrders()).some(
      (o) => o.customer.email.toLowerCase() === email,
    );
    if (hasPriorOrders) {
      return NextResponse.json(
        { ok: false, code: 'ACCOUNT_REQUIRED', error: 'Este correo ya tiene pedidos. Crea una cuenta para continuar.' },
        { status: 409 },
      );
    }
  }

  // Registro opcional desde el checkout.
  let newCustomer: { id: number; email: string } | null = null;
  if (createAccount && !existing) {
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 },
      );
    }
    const created = await createCustomer({
      nombre,
      apellido,
      email,
      telefono,
      passwordHash: hashPassword(password),
    });
    newCustomer = { id: created.id, email: created.email };
  }

  const subtotal = Number(body.subtotal ?? items.reduce((n, i) => n + i.price * i.qty, 0));

  const order = await createOrder({
    status: 'pendiente',
    customer: { nombre, apellido, email, telefono },
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

  const res = NextResponse.json({ ok: true, order });
  if (newCustomer) {
    res.cookies.set(CUSTOMER_COOKIE, signCustomerToken(newCustomer.id, newCustomer.email), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return res;
}
