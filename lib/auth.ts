import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.ADMIN_SECRET || 'tassloco507-local-dev-secret';
export const ADMIN_USER = process.env.ADMIN_USER || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tassloco507';
export const AUTH_COOKIE = 'tassloco_admin';

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function verifyCredentials(user: string, password: string): boolean {
  return safeEqual(user, ADMIN_USER) && safeEqual(password, ADMIN_PASSWORD);
}

export function signToken(): string {
  const payload = `${ADMIN_USER}:${Date.now()}`;
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(AUTH_COOKIE)?.value);
}

export function verifyToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex');
  if (!safeEqual(sig, expected)) return false;
  const [user] = payload.split(':');
  return user === ADMIN_USER;
}
