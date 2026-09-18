import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.AUTH_SECRET || 'tassloco507-customer-secret';
export const CUSTOMER_COOKIE = 'tassloco_customer';

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function signCustomerToken(id: number, email: string): string {
  const payload = `${id}:${email}:${Date.now()}`;
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  return `${encoded}.${sig}`;
}

export function verifyCustomerToken(token: string | undefined | null): { id: number; email: string } | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot === -1) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex');
  if (!safeEqual(sig, expected)) return null;
  const [id, email] = payload.split(':');
  const nid = Number(id);
  if (!Number.isFinite(nid) || !email) return null;
  return { id: nid, email };
}

export async function currentCustomer(): Promise<{ id: number; email: string } | null> {
  const store = await cookies();
  return verifyCustomerToken(store.get(CUSTOMER_COOKIE)?.value);
}
