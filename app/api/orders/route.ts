import { NextResponse } from 'next/server';
import { createCustomer, createOrder, getCustomerByEmail, getProductBySlug, type Customer } from '@/lib/db';
import { sendOrderEmails } from '@/lib/email';
import { CUSTOMER_COOKIE, currentCustomer, signCustomerToken } from '@/lib/customer-auth';
import { hashPassword } from '@/lib/password';
import { cookieOptions } from '@/lib/session-token';
import { enforceRateLimit } from '@/lib/rate-limit';
import { priceCheckoutItems } from '@/lib/checkout-security';
import { readJsonObject, textField, emailField, passwordField, errorResponse, RequestError } from '@/lib/request-security';

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestError('Datos incompletos.');
  return value as Record<string, unknown>;
}

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, 'orders-ip', 10, 900);
    if (limited) return limited;
    const body = await readJsonObject(req);
    if (body.website) throw new RequestError('Solicitud inválida.');
    const customer = object(body.customer);
    const delivery = object(body.delivery);
    const payment = object(body.payment);
    const nombre = textField(customer.nombre, 100, true);
    const apellido = textField(customer.apellido, 100);
    const email = emailField(customer.email);
    const telefono = textField(customer.telefono, 40, true);
    if (!['envio', 'recoger'].includes(String(delivery.method)) || !['efectivo', 'transferencia'].includes(String(payment.method))) {
      throw new RequestError('Entrega o pago inválidos.');
    }
    const shipping = delivery.method === 'envio';
    const deliveryData = {
      method: shipping ? 'envio' as const : 'recoger' as const,
      provincia: textField(delivery.provincia, 100, shipping),
      ciudad: textField(delivery.ciudad, 100, shipping),
      direccion: textField(delivery.direccion, 500, shipping),
      referencia: textField(delivery.referencia, 500),
    };
    const emailLimited = await enforceRateLimit(req, 'orders-account', 5, 900, email);
    if (emailLimited) return emailLimited;
    const { items, subtotal } = await priceCheckoutItems(body.items, getProductBySlug);
    const existing = await getCustomerByEmail(email);
    const session = await currentCustomer();
    const isAuth = Boolean(session && session.email === email && session.id === existing?.id);
    if (existing && !isAuth) {
      return NextResponse.json({ ok: false, code: 'LOGIN_REQUIRED', error: 'Inicia sesión para continuar con este correo.' }, { status: 409 });
    }
    let newCustomer: Customer | null = null;
    if (body.createAccount === true && !existing) {
      const password = passwordField(body.password, 12);
      newCustomer = await createCustomer({ nombre, apellido, email, telefono, passwordHash: hashPassword(password) });
    }
    // Preparar la sesión antes de registrar el pedido para fallar si falta la migración.
    const token = newCustomer ? await signCustomerToken(newCustomer) : null;
    const order = await createOrder({
      status: 'pendiente', customerId: isAuth ? session!.id : newCustomer?.id ?? null,
      customer: { nombre, apellido, email, telefono }, delivery: deliveryData,
      payment: { method: payment.method === 'efectivo' ? 'efectivo' : 'transferencia' },
      items, subtotal, total: subtotal,
    });
    await sendOrderEmails(order).catch(() => {});
    const res = NextResponse.json({ ok: true, order });
    if (token) res.cookies.set(CUSTOMER_COOKIE, token, cookieOptions('customer'));
    return res;
  } catch (error) { return errorResponse(error); }
}
