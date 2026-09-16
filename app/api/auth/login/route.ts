import { NextResponse } from 'next/server';
import { getCustomerByEmail } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { CUSTOMER_COOKIE, signCustomerToken } from '@/lib/customer-auth';

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  const customer = getCustomerByEmail(email);
  if (!customer || !verifyPassword(password, customer.passwordHash)) {
    return NextResponse.json({ ok: false, error: 'Correo o contraseña incorrectos' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, customer: { id: customer.id, nombre: customer.nombre, email: customer.email } });
  res.cookies.set(CUSTOMER_COOKIE, signCustomerToken(customer.id, customer.email), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
