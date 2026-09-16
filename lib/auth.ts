import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getAdminByEmail } from './db';
import { verifyPassword } from './password';

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

/**
 * Verifica credenciales de admin: primero contra la tabla `admins` y,
 * como respaldo, contra las credenciales legacy de variables de entorno.
 * Devuelve la identidad (email) si es válido, o null.
 */
export async function verifyCredentials(email: string, password: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (normalized) {
    try {
      const admin = await getAdminByEmail(normalized);
      if (admin && verifyPassword(password, admin.passwordHash)) {
        return normalized;
      }
    } catch {
      // tabla admins aún no existe → cae al fallback
    }
  }
  if (safeEqual(normalized, ADMIN_USER) && safeEqual(password, ADMIN_PASSWORD)) {
    return ADMIN_USER;
  }
  return null;
}

export function signToken(identity = ADMIN_USER): string {
  const payload = `${identity}:${Date.now()}`;
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex');
  if (!safeEqual(sig, expected)) return null;
  return payload.split(':')[0] || null;
}

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return Boolean(verifyToken(store.get(AUTH_COOKIE)?.value));
}
