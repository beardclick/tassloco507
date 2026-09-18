import { NextResponse } from 'next/server';
import { createCustomer, getCustomerByEmail } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { CUSTOMER_COOKIE, signCustomerToken } from '@/lib/customer-auth';

export async function POST(req: Request) {
  const body = await req.json();
  // Honeypot anti-spam: si el campo oculto "website" viene lleno, es un bot.
  if (String(body.website ?? '').trim()) {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  }
  const nombre = String(body.nombre ?? '').trim();
  const apellido = String(body.apellido ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const telefono = String(body.telefono ?? '').trim();
  const password = String(body.password ?? '');

  if (!nombre || !email || password.length < 6) {
    return NextResponse.json(
      { ok: false, error: 'Completa nombre, un correo válido y una contraseña de al menos 6 caracteres' },
      { status: 400 },
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Correo no válido' }, { status: 400 });
  }
  if (await getCustomerByEmail(email)) {
    return NextResponse.json({ ok: false, error: 'Ya existe una cuenta con ese correo' }, { status: 400 });
  }

  const customer = await createCustomer({
    nombre,
    apellido,
    email,
    telefono,
    passwordHash: hashPassword(password),
  });

  const res = NextResponse.json({ ok: true, customer: { id: customer.id, nombre: customer.nombre, email: customer.email } });
  res.cookies.set(CUSTOMER_COOKIE, signCustomerToken(customer.id, customer.email), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
