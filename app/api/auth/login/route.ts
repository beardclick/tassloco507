import { NextResponse } from 'next/server';
import { getCustomerByEmail } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { CUSTOMER_COOKIE, signCustomerToken } from '@/lib/customer-auth';
import { cookieOptions } from '@/lib/session-token';
import { enforceRateLimit } from '@/lib/rate-limit';
import { readJsonObject, emailField, passwordField, errorResponse, RequestError } from '@/lib/request-security';

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, 'customer-login-ip', 20, 900);
    if (limited) return limited;
    const body = await readJsonObject(req);
    if (body.website) throw new RequestError('Solicitud inválida.');
    const email = emailField(body.email);
    const password = passwordField(body.password);
    const accountLimited = await enforceRateLimit(req, 'customer-login-account', 5, 900, email);
    if (accountLimited) return accountLimited;
    const customer = await getCustomerByEmail(email);
    if (!customer || !verifyPassword(password, customer.passwordHash)) {
      return NextResponse.json({ ok: false, error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }
    const token = await signCustomerToken(customer);
    const res = NextResponse.json({ ok: true, customer: { id: customer.id, nombre: customer.nombre, email: customer.email } });
    res.cookies.set(CUSTOMER_COOKIE, token, cookieOptions('customer'));
    return res;
  } catch (error) { return errorResponse(error); }
}
