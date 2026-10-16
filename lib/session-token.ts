import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type SessionKind = 'admin' | 'customer';
export const SESSION_TTL = { admin: 8 * 60 * 60, customer: 7 * 24 * 60 * 60 };

export function sessionSecret(kind: SessionKind): string {
  const name = kind === 'admin' ? 'ADMIN_SECRET' : 'AUTH_SECRET';
  const secret = process.env[name];
  if (!secret || secret.length < 32 || /tassloco|frase-secreta|change.?me/i.test(secret)) {
    throw new Error(`Configura ${name} con un secreto aleatorio de al menos 32 caracteres.`);
  }
  return secret;
}

export function issueToken(kind: SessionKind, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ v: 2, kind, iat: now, exp: now + SESSION_TTL[kind] * 1000, nonce: randomBytes(32).toString('hex') })).toString('base64url');
  return `${payload}.${createHmac('sha256', sessionSecret(kind)).update(payload).digest('hex')}`;
}

export function validToken(token: string | null | undefined, kind: SessionKind, now = Date.now()): boolean {
  if (!token || token.length > 1024) return false;
  try {
    const [payload, signature, extra] = token.split('.');
    if (extra !== undefined || !/^[a-f0-9]{64}$/.test(signature ?? '')) return false;
    const expected = createHmac('sha256', sessionSecret(kind)).update(payload).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return false;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims.v === 2 && claims.kind === kind && /^[a-f0-9]{64}$/.test(claims.nonce)
      && Number.isSafeInteger(claims.iat) && Number.isSafeInteger(claims.exp)
      && claims.iat <= now && claims.exp > now && claims.exp - claims.iat === SESSION_TTL[kind] * 1000;
  } catch {
    return false;
  }
}

export function cookieOptions(kind: SessionKind) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: SESSION_TTL[kind] };
}
