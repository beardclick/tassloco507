import { NextResponse } from 'next/server';
import { createCustomer, getCustomerByEmail } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { CUSTOMER_COOKIE, signCustomerToken } from '@/lib/customer-auth';
import { cookieOptions } from '@/lib/session-token';
import { enforceRateLimit } from '@/lib/rate-limit';
import { readJsonObject, textField, emailField, passwordField, errorResponse, RequestError } from '@/lib/request-security';

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, 'registration-ip', 5, 3600);
    if (limited) return limited;
    const body = await readJsonObject(req);
    if (body.website) throw new RequestError('Solicitud inválida.');
    const nombre = textField(body.nombre, 100, true);
    const apellido = textField(body.apellido, 100);
    const email = emailField(body.email);
    const telefono = textField(body.telefono, 40);
    const password = passwordField(body.password, 12);
    const accountLimited = await enforceRateLimit(req, 'registration-account', 3, 3600, email);
    if (accountLimited) return accountLimited;
    if (await getCustomerByEmail(email)) {
      throw new RequestError('No se pudo crear la cuenta. Si ya tienes una, inicia sesión.');
    }
    const customer = await createCustomer({ nombre, apellido, email, telefono, passwordHash: hashPassword(password) });
    const token = await signCustomerToken(customer);
    const res = NextResponse.json({ ok: true, customer: { id: customer.id, nombre: customer.nombre, email: customer.email } });
    res.cookies.set(CUSTOMER_COOKIE, token, cookieOptions('customer'));
    return res;
  } catch (error) { return errorResponse(error); }
}
